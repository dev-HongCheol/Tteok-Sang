/**
 * Gemini AI를 사용하여 수집된 피드를 분석하고 인사이트를 추출하는 비즈니스 로직 모듈입니다.
 */
import { z } from 'zod';
import type { Feed } from '@/entities/feed/model/types';
import type { CreateInsight, Insight, MentionedStock } from '@/entities/insight/model/types';
import { geminiModel } from '@/shared/api/gemini/client';
import { supabase } from '@/shared/api/supabase/client';

/** AI 분석을 위한 개별 종목 정보 스키마 (DTO) */
const aiMentionedStockSchema = z.object({
  ticker: z.string().describe('상장사인 경우 공식 티커(NVDA, 005930 등). 비상장사 또는 확인 불가 시 반드시 빈 문자열("")'),
  name_ko: z.string().describe('가장 널리 쓰이는 표준 한글 종목명. 본문의 오타나 약어에 상관없이 표준 명칭으로 교정하여 작성 (예: "엔트로픽", "엔비디아", "오픈AI")'),
});

/** AI 분석 응답용 개별 아이템 스키마 (DTO) */
const aiAnalysisItemSchema = z.object({
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

const aiAnalysisBatchResponseSchema = z.array(aiAnalysisItemSchema);
type AIAnalysisDTO = z.infer<typeof aiAnalysisItemSchema>;

const MAX_CONTENT_LENGTH = 1000;
const RECOMMENDED_BATCH_TEXT_LENGTH = 5000;

const SECTOR_LIST = [
  '거시경제', '정책/정치', '인공지능', '반도체', '2차전지', '빅테크', '자동차', '에너지/원자재', 
  '로봇', '바이오', '증권/금융', '소비재/유통', '부동산', '코인', '공시/실적', '방산', '조선', 
  '기타(분류외)', '분석불가(비관련)',
];

/**
 * AI가 추출한 종목 리스트를 DB 마스터 데이터(ts_stocks) 기준으로 정규화합니다.
 * @param {MentionedStock[]} aiStocks AI가 추출한 종목 리스트
 * @returns {Promise<MentionedStock[]>} 정규화된 종목 리스트
 */
const normalizeStocks = async (aiStocks: MentionedStock[]): Promise<MentionedStock[]> => {
  if (!aiStocks || aiStocks.length === 0) return [];

  const normalizedList: MentionedStock[] = [];

  for (const stock of aiStocks) {
    // 1. 티커로 정확히 일치하는 종목 찾기
    const { data: byTicker } = await supabase
      .from('ts_stocks')
      .select('*')
      .eq('ticker', stock.ticker)
      .maybeSingle();

    if (byTicker) {
      normalizedList.push({
        ticker: byTicker.ticker,
        name_ko: byTicker.name_ko,
        is_verified: byTicker.is_verified,
      });
      continue;
    }

    // 2. 이름 또는 별칭(Aliases)으로 일치하는 종목 찾기
    const { data: byNameOrAlias } = await supabase
      .from('ts_stocks')
      .select('*')
      .or(`name_ko.eq."${stock.name_ko}",aliases.cs.{"${stock.name_ko}"}`)
      .maybeSingle();

    if (byNameOrAlias) {
      normalizedList.push({
        ticker: byNameOrAlias.ticker,
        name_ko: byNameOrAlias.name_ko,
        is_verified: byNameOrAlias.is_verified,
      });
      continue;
    }

    // 3. 일치하는 항목이 없으면 미검증 종목으로 신규 등록 후보
    if (stock.name_ko) {
      const tempTicker = stock.ticker || `UNKN_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      const newStock = {
        ticker: tempTicker,
        name_ko: stock.name_ko,
        is_verified: false,
      };

      // DB에 미검증 상태로 임시 저장
      await supabase.from('ts_stocks').upsert({
        ticker: newStock.ticker,
        name_ko: newStock.name_ko,
        is_verified: false,
        mention_count: 1
      }, { onConflict: 'ticker' });

      normalizedList.push(newStock);
    }
  }

  return normalizedList;
};

/**
 * 분석 실패 시 DB에 저장할 기본값(Fallback) 인사이트 객체를 생성합니다.
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

  // 1. 배치 분할 로직
  if (totalLength > RECOMMENDED_BATCH_TEXT_LENGTH && feeds.length > 1) {
    const mid = Math.ceil(feeds.length / 2);
    const results = await Promise.all([
      analyzeFeedsBatch(feeds.slice(0, mid)),
      analyzeFeedsBatch(feeds.slice(mid)),
    ]);
    return results.flat();
  }

  // 2. 단일 피드 길이 초과 처리
  if (feeds.length === 1 && feeds[0].content.length > RECOMMENDED_BATCH_TEXT_LENGTH) {
    const fallback = createFallbackInsight(feeds[0].id, '텍스트 길이 초과');
    const { data } = await supabase.from('ts_insights').insert(fallback).select();
    return data || [];
  }

  // 0. 마스터 데이터에서 주요 종목(Verified) 50개 가져오기
  const { data: verifiedStocks } = await supabase
    .from('ts_stocks')
    .select('ticker, name_ko')
    .eq('is_verified', true)
    .limit(50);

  const stockReference = verifiedStocks 
    ? verifiedStocks.map(s => `${s.name_ko}(${s.ticker})`).join(', ')
    : 'N/A';

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

    [참조: 주요 종목 리스트]
    이 리스트에 있는 종목은 반드시 리스트의 티커와 이름을 우선 사용하세요:
    ${stockReference}

    [텍스트 리스트]
    ${feedContents}

    [응답 가이드라인]
    각 아이템에 대해 다음 필드를 포함한 JSON 배열을 반환하세요:
    - batch_index: 위 리스트에서 명시된 [Index: ...]의 숫자.
    - relevance_score: 관련성 점수 (0~100).
    - importance: 'Low', 'Medium', 'High' 중 하나.
    - market_type: 'KR', 'US', 'Global' 중 하나.
    - mentioned_stocks: [{ticker: "...", name_ko: "..."}] 형식의 배열.
      1. 본문이 특정 기업이 아닌 거시경제 맥락이라면 [].
      2. 상장사만 공식 티커를 작성하고, 비상장사는 ticker를 반드시 빈 문자열("")로 작성하세요.
      3. [참조: 주요 종목 리스트]를 확인하여 이미 알고 있는 종목은 해당 티커를 사용하세요.
      4. name_ko는 시장에서 통용되는 "표준 한글 명칭"을 사용하세요.
      5. 언급된 종목이 없으면 [].
    - is_explicit: 기업명 명시 여부.
    - sectors: [${SECTOR_LIST.join(', ')}] 중 선택하여 배열로.
    - sentiment_direction: 'Bullish', 'Bearish', 'Neutral' 중 하나.
    - sentiment_intensity: 강도 (1~5).
    - investment_horizon: 'intraday', 'swing', 'long-term' 중 하나.
    - confidence_level: 'low', 'medium', 'high' 중 하나.
    - logic_type: 판단 근거 태그 배열.
    - summary_line: 1줄 요약.

    JSON 외의 텍스트는 포함하지 마세요.
  `;

  try {
    const result = await geminiModel.generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    const aiData: AIAnalysisDTO[] = aiAnalysisBatchResponseSchema.parse(
      JSON.parse(jsonMatch ? jsonMatch[0] : responseText),
    );

    // AI DTO -> DB Entity Mapping (Normalization Layer 적용)
    const insightsToInsert: CreateInsight[] = await Promise.all(aiData.map(async (item) => {
      const originalFeed = feeds[item.batch_index];
      if (!originalFeed) throw new Error(`Invalid batch_index: ${item.batch_index}`);

      const normalizedStocks = await normalizeStocks(item.mentioned_stocks || []);

      return {
        feed_id: originalFeed.id,
        relevance_score: item.relevance_score,
        importance: item.importance,
        market_type: item.market_type,
        mentioned_stocks: normalizedStocks,
        is_explicit: item.is_explicit,
        sectors: item.sectors,
        sentiment_direction: item.sentiment_direction,
        sentiment_intensity: item.sentiment_intensity,
        investment_horizon: item.investment_horizon,
        confidence_level: item.confidence_level,
        logic_type: item.logic_type,
        summary_line: item.summary_line,
      };
    }));

    const { data, error } = await supabase.from('ts_insights').insert(insightsToInsert).select();
    if (error) throw new Error(`DB 저장 실패: ${error.message}`);

    return data || [];
  } catch (error: any) {
    if (feeds.length > 1) {
      const mid = Math.floor(feeds.length / 2);
      const results = await Promise.all([
        analyzeFeedsBatch(feeds.slice(0, mid)),
        new Promise((r) => setTimeout(r, 2000)).then(() => analyzeFeedsBatch(feeds.slice(mid))),
      ]);
      return results.flat();
    }

    const fallback = createFallbackInsight(feeds[0].id, error.message || 'Unknown error');
    const { data } = await supabase.from('ts_insights').insert(fallback).select();
    return data || [];
  }
};
