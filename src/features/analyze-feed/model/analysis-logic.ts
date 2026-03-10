import { z } from 'zod';
import type { Feed } from '@/entities/feed/model/types';
import { geminiModel } from '@/shared/api/gemini/client';
import { supabase } from '@/shared/api/supabase/client';

/** AI가 추출한 개별 종목 정보 스키마 */
const mentionedStockSchema = z.object({
  /** 종목 티커 (예: NVDA, 005930) */
  ticker: z.string().describe('종목 티커 (예: NVDA, 005930)'),
  /** 공식 한글 종목명 (예: 엔비디아, 삼성전자) */
  name_ko: z.string().describe('공식 한글 종목명 (예: 엔비디아, 삼성전자)'),
});

/** AI가 분석한 개별 피드 인사이트 구조 스키마 */
const individualAnalysisSchema = z.object({
  /** 원본 피드 고유 ID */
  feed_id: z.string(),
  /** 경제/주식 관련성 점수 (0~100) */
  relevance_score: z.number().min(0).max(100),
  /** 인사이트 중요도 */
  importance: z.enum(['Low', 'Medium', 'High']),
  /** 대상 시장 분류 (한국, 미국, 글로벌) */
  market_type: z.enum(['KR', 'US', 'Global']),
  /** 언급된 종목 리스트 */
  mentioned_stocks: z.array(mentionedStockSchema).nullable(),
  /** 종목명 직접 명시 여부 */
  is_explicit: z.boolean(),
  /** 관련 섹터 태그 리스트 */
  sectors: z.array(z.string()),
  /** 투자 방향성 (Bullish, Bearish, Neutral) */
  sentiment_direction: z.enum(['Bullish', 'Bearish', 'Neutral']),
  /** 관점의 강도 (1~5) */
  sentiment_intensity: z.number().min(1).max(5),
  /** 투자 시계/호흡 */
  investment_horizon: z.enum(['intraday', 'swing', 'long-term']),
  /** AI 판단 확신도 */
  confidence_level: z.enum(['low', 'medium', 'high']),
  /** 판단 근거 유형 리스트 */
  logic_type: z.array(z.string()),
  /** 핵심 논리 1줄 요약 */
  summary_line: z.string().nullable(),
});

/** 배치 분석 응답 데이터 스키마 */
export const batchAnalysisResponseSchema = z.array(individualAnalysisSchema);

/** AI 분석 응답 타입 */
export type AnalysisResponse = z.infer<typeof individualAnalysisSchema>;

const MAX_CONTENT_LENGTH = 1000;

/** 분석 가능한 섹터 전체 리스트 */
const SECTOR_LIST = [
  '거시경제', '정책/정치', '인공지능', '반도체', '2차전지', '빅테크', 
  '자동차', '에너지/원자재', '로봇', '바이오', '증권/금융', '소비재/유통', 
  '부동산', '코인', '공시/실적', '방산', '조선', '기타(분류외)', '분석불가(비관련)'
];

/**
 * 여러 트윗 피드를 한꺼번에 분석하여 인사이트를 도출하고 DB에 저장합니다.
 * @param feeds 분석 대상 피드 배열
 * @returns AI 분석 결과 배열
 */
export const analyzeFeedsBatch = async (feeds: Feed[]): Promise<AnalysisResponse[]> => {
  if (feeds.length === 0) return [];

  const feedContents = feeds
    .map((f) => {
      const truncatedContent =
        f.content.length > MAX_CONTENT_LENGTH
          ? `${f.content.slice(0, MAX_CONTENT_LENGTH)}...`
          : f.content;
      return `[ID: ${f.id}] [Content: ${truncatedContent}]`;
    })
    .join('\n---\n');

  const prompt = `
    당신은 숙련된 금융 전문가이자 데이터 구조화 전문가입니다. 
    제공되는 ${feeds.length}개의 트윗 리스트를 분석하여 각각의 투자 가치를 정밀하게 구조화하세요.

    [트윗 리스트]
    ${feedContents}

    [분석 및 추출 가이드라인]
    1. 각 트윗에 대해 다음 정보를 정확히 추출하세요:
       - feed_id: 각 트윗의 [ID: ...]에 명시된 ID를 정확히 응답에 포함하세요.
       - relevance_score: 투자 정보로서의 가치 (0~100). (단순 일상은 0~20점)
       - market_type: 'KR'(한국), 'US'(미국), 'Global'(공통/기타) 중 선택.
       - mentioned_stocks: 언급되거나 확실히 추론되는 기업의 [{ticker, name_ko}] 리스트. 없으면 빈 배열.
       - is_explicit: 기업명이 본문에 직접 명시되었으면 true, 맥락상 추론이면 false.
       - sectors: 관련 섹터를 다음 리스트에서 1개 이상 선택: [${SECTOR_LIST.join(', ')}].
       - sentiment_direction: 투자 관점의 방향성 ('Bullish', 'Bearish', 'Neutral').
       - sentiment_intensity: 관점의 강도 (1: 매우 약함 ~ 5: 매우 강함).
       - investment_horizon: 권장 투자 기간 ('intraday', 'swing', 'long-term').
       - confidence_level: AI인 당신의 판단 확신도 ('low', 'medium', 'high').
       - logic_type: 판단 근거 유형 (예: valuation, momentum, macro, earnings, rumor 등).
       - summary_line: 핵심 논리를 담은 정교한 1줄 요약.
    
    2. '분석불가(비관련)' 섹터 기준: 투자와 무관한 일상, 광고, 스팸 등은 relevance_score를 낮게 주고 섹터에 '분석불가(비관련)'를 포함하세요.
    3. 반드시 모든 트윗에 대해 분석 결과를 포함한 JSON 배열 형태로만 응답하세요.
  `;

  try {
    const result = await geminiModel.generateContent(prompt);
    const responseText = result.response.text();

    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    const cleanJson = jsonMatch ? jsonMatch[0] : responseText;

    const jsonResponse = JSON.parse(cleanJson);
    const validatedBatchData = batchAnalysisResponseSchema.parse(jsonResponse);

    const insightsToInsert = validatedBatchData.map((data) => ({
      feed_id: data.feed_id,
      relevance_score: data.relevance_score,
      importance: data.importance,
      market_type: data.market_type,
      mentioned_stocks: data.mentioned_stocks,
      is_explicit: data.is_explicit,
      sectors: data.sectors,
      sentiment_direction: data.sentiment_direction,
      sentiment_intensity: data.sentiment_intensity,
      investment_horizon: data.investment_horizon,
      confidence_level: data.confidence_level,
      logic_type: data.logic_type,
      summary_line: data.summary_line,
    }));

    const { error: insertError } = await supabase.from('ts_insights').insert(insightsToInsert);
    if (insertError) throw new Error(`DB 저장 실패: ${insertError.message}`);

    return validatedBatchData;
  } catch (error: any) {
    throw error;
  }
};
