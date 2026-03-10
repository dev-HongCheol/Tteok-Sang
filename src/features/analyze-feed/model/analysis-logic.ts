/**
 * Gemini AI를 사용하여 수집된 피드를 분석하고 인사이트를 추출하는 비즈니스 로직 모듈입니다.
 */
import { z } from 'zod';
import type { Feed } from '@/entities/feed/model/types';
import type { CreateInsight, Insight } from '@/entities/insight/model/types';
import { geminiModel } from '@/shared/api/gemini/client';
import { supabase } from '@/shared/api/supabase/client';

/** AI 분석을 위한 개별 종목 정보 스키마 (DTO) */
const aiMentionedStockSchema = z.object({
  ticker: z.string().describe('종목 티커 (예: NVDA, 005930)'),
  name_ko: z.string().describe('공식 한글 종목명 (예: 엔비디아, 삼성전자)'),
});

/** AI 분석 응답용 개별 아이템 스키마 (DTO) */
const aiAnalysisItemSchema = z.object({
  /** 피드 배열에서의 인덱스 번호 (중요: ID가 아님) */
  batch_index: z.number(),
  relevance_score: z.number().min(0).max(100),
  importance: z.enum(['Low', 'Medium', 'High']),
  market_type: z.enum(['KR', 'US', 'Global']),
  mentioned_stocks: z.array(aiMentionedStockSchema).nullable(),
  is_explicit: z.boolean(),
  sectors: z.array(z.string()),
  sentiment_direction: z.enum(['Bullish', 'Bearish', 'Neutral']),
  sentiment_intensity: z.number().min(1).max(5),
  investment_horizon: z.enum(['intraday', 'swing', 'long-term']),
  confidence_level: z.enum(['low', 'medium', 'high']),
  logic_type: z.array(z.string()),
  summary_line: z.string().nullable(),
});

/** 배치 분석 응답 데이터 스키마 (DTO List) */
const aiAnalysisBatchResponseSchema = z.array(aiAnalysisItemSchema);

/** AI 분석 응답 DTO 타입 */
type AIAnalysisDTO = z.infer<typeof aiAnalysisItemSchema>;

const MAX_CONTENT_LENGTH = 1000;
const RECOMMENDED_BATCH_TEXT_LENGTH = 5000;

const SECTOR_LIST = [
  '거시경제', '정책/정치', '인공지능', '반도체', '2차전지', '빅테크', 
  '자동차', '에너지/원자재', '로봇', '바이오', '증권/금융', 
  '소비재/유통', '부동산', '코인', '공시/실적', '방산', '조선', 
  '기타(분류외)', '분석불가(비관련)',
];

/**
 * 분석 실패 시 DB에 저장할 기본값(Fallback) 인사이트 객체를 생성합니다.
 * @param {string} feedId 원본 피드 ID
 * @param {string} reason 분석 실패 사유
 * @returns {CreateInsight} 폴백 인사이트 객체
 */
const createFallbackInsight = (feedId: string, reason: string): CreateInsight => ({
  feed_id: feedId,
  relevance_score: 0,
  importance: 'Low',
  market_type: 'Global',
  mentioned_stocks: [],
  is_explicit: false,
  sectors: ['분석불가(비관련)'],
  sentiment_direction: 'Neutral',
  sentiment_intensity: 1,
  investment_horizon: 'intraday',
  confidence_level: 'low',
  logic_type: ['system'],
  summary_line: `분석불가: ${reason}`,
});

/**
 * 여러 피드를 한꺼번에 AI로 분석하고 결과를 DB에 저장합니다.
 * @param {Feed[]} feeds 분석 대상 피드 리스트
 * @returns {Promise<Insight[]>} 저장된 인사이트 데이터 리스트
 */
export const analyzeFeedsBatch = async (feeds: Feed[]): Promise<Insight[]> => {
  if (feeds.length === 0) return [];

  const totalLength = feeds.reduce((acc, f) => acc + f.content.length, 0);

  // 1. 배치 분할 로직 (텍스트가 너무 길면 나눠서 재귀 호출)
  if (totalLength > RECOMMENDED_BATCH_TEXT_LENGTH && feeds.length > 1) {
    console.warn(`[Batch Split] Total length ${totalLength} chars. Splitting batch.`);
    const mid = Math.ceil(feeds.length / 2);
    const results = await Promise.all([
      analyzeFeedsBatch(feeds.slice(0, mid)),
      analyzeFeedsBatch(feeds.slice(mid)),
    ]);
    return results.flat();
  }

  // 2. 단일 피드가 너무 긴 경우 즉시 폴백 처리
  if (feeds.length === 1 && feeds[0].content.length > RECOMMENDED_BATCH_TEXT_LENGTH) {
    const fallback = createFallbackInsight(feeds[0].id, '텍스트 길이 초과');
    const { data, error } = await supabase.from('ts_insights').insert(fallback).select();
    if (error) console.error('Fallback save failed:', error);
    return data || [];
  }

  // 3. AI 프롬프트 구성
  const feedContents = feeds
    .map((f, i) => {
      const content = f.content.length > MAX_CONTENT_LENGTH 
        ? `${f.content.slice(0, MAX_CONTENT_LENGTH)}...` 
        : f.content;
      return `[Index: ${i}] [Content: ${content}]`;
    })
    .join('\n---\n');

  const prompt = `
    당신은 숙련된 금융 전문가입니다. 
    제공되는 ${feeds.length}개의 텍스트를 분석하여 각각의 투자 가치를 구조화하세요.

    [텍스트 리스트]
    ${feedContents}

    [응답 가이드라인]
    각 아이템에 대해 다음 필드를 포함한 JSON 배열을 반환하세요:
    - batch_index: 위 리스트에서 명시된 [Index: ...]의 숫자.
    - relevance_score: 관련성 점수 (0~100).
    - importance: 'Low', 'Medium', 'High' 중 하나.
    - market_type: 'KR', 'US', 'Global' 중 하나.
    - mentioned_stocks: [{ticker: "...", name_ko: "..."}] 형식의 배열. 없으면 [].
    - is_explicit: 기업명 명시 여부 (true/false).
    - sectors: [${SECTOR_LIST.join(', ')}] 중 선택하여 배열로.
    - sentiment_direction: 'Bullish', 'Bearish', 'Neutral' 중 하나.
    - sentiment_intensity: 강도 (1~5).
    - investment_horizon: 'intraday', 'swing', 'long-term' 중 하나.
    - confidence_level: 'low', 'medium', 'high' 중 하나.
    - logic_type: 판단 근거 태그 배열 (예: ["valuation", "macro"]).
    - summary_line: 1줄 요약.

    JSON 외의 텍스트는 포함하지 마세요.
  `;

  try {
    const result = await geminiModel.generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    const aiData: AIAnalysisDTO[] = aiAnalysisBatchResponseSchema.parse(JSON.parse(jsonMatch ? jsonMatch[0] : responseText));

    // AI DTO -> DB Entity Mapping
    const insightsToInsert: CreateInsight[] = aiData.map((item) => {
      const originalFeed = feeds[item.batch_index];
      if (!originalFeed) throw new Error(`Invalid batch_index returned: ${item.batch_index}`);

      return {
        feed_id: originalFeed.id,
        relevance_score: item.relevance_score,
        importance: item.importance,
        market_type: item.market_type,
        mentioned_stocks: item.mentioned_stocks,
        is_explicit: item.is_explicit,
        sectors: item.sectors,
        sentiment_direction: item.sentiment_direction,
        sentiment_intensity: item.sentiment_intensity,
        investment_horizon: item.investment_horizon,
        confidence_level: item.confidence_level,
        logic_type: item.logic_type,
        summary_line: item.summary_line,
      };
    });

    const { data, error } = await supabase.from('ts_insights').insert(insightsToInsert).select();
    if (error) throw new Error(`DB 저장 실패: ${error.message}`);
    
    return data || [];

  } catch (error: any) {
    // 분석 실패 시 재시도 또는 폴백
    if (feeds.length > 1) {
      console.warn(`[Batch Failure] Retrying split: ${error.message}`);
      const mid = Math.floor(feeds.length / 2);
      const results = await Promise.all([
        analyzeFeedsBatch(feeds.slice(0, mid)),
        new Promise(r => setTimeout(r, 2000)).then(() => analyzeFeedsBatch(feeds.slice(mid))),
      ]);
      return results.flat();
    }

    const fallback = createFallbackInsight(feeds[0].id, error.message || 'Unknown error');
    const { data } = await supabase.from('ts_insights').insert(fallback).select();
    return data || [];
  }
};
