/**
 * AI 분석 인사이트(Insight) 엔티티와 관련된 API 요청을 처리하는 모듈입니다.
 */
import { supabase } from '@/shared/api/supabase/client';
import type { Insight, MarketType, StockSentimentRanking } from '../model/types';
import type { Feed } from '@/entities/feed/model/types';
import type { Expert } from '@/entities/expert/model/types';

/** 전문가 정보와 피드 원본을 포함한 인사이트 확장 타입 */
export interface InsightWithDetails extends Insight {
  /** 연결된 원본 피드 및 전문가 정보 */
  ts_feeds: Feed & {
    /** 피드를 작성한 전문가 정보 */
    ts_experts: Expert;
  };
}

/** 인사이트 목록 조회를 위한 필터 파라미터 */
export interface GetInsightsParams {
  /** 대상 섹터 리스트 (배열 포함 여부로 필터링) */
  sectors?: string[];
  /** 중요도 리스트 (Low, Medium, High) */
  importances?: string[];
  /** 시장 분류 리스트 (KR, US, Global) */
  marketTypes?: MarketType[];
  /** 특정 전문가 ID 리스트 (undefined: 전체) */
  expertIds?: string[];
  /** 조회 시작 일시 (ISO string) */
  startDate?: string;
  /** 조회 종료 일시 (ISO string) */
  endDate?: string;
  /** 검색 키워드 (요약 및 본문 대상) */
  searchQuery?: string;
}

/**
 * 필터 조건에 맞는 인사이트 목록을 상세 정보와 함께 조회합니다.
 * @param {GetInsightsParams} params 필터 조건 객체
 * @returns {Promise<InsightWithDetails[]>} 상세 정보를 포함한 인사이트 목록 배열
 */
export const getInsights = async (params: GetInsightsParams): Promise<InsightWithDetails[]> => {
  let query = supabase
    .from('ts_insights')
    .select(`
      *,
      ts_feeds!inner (
        *,
        ts_experts!inner (*)
      )
    `)
    .order('created_at', { ascending: false });

  // 1. 중요도 필터
  if (params.importances && params.importances.length > 0) {
    query = query.in('importance', params.importances);
  }

  // 2. 시장 분류 필터
  if (params.marketTypes && params.marketTypes.length > 0) {
    query = query.in('market_type', params.marketTypes);
  }

  // 3. 섹터 필터 (PostgreSQL text[] containment 사용)
  if (params.sectors && params.sectors.length > 0 && !params.sectors.includes('전체')) {
    query = query.overlaps('sectors', params.sectors);
  }

  // 4. 분석 계정(전문가) 필터
  if (params.expertIds !== undefined) {
    if (params.expertIds.length === 0) {
      // 명시적으로 아무것도 선택하지 않은 경우 -> 존재할 수 없는 ID로 빈 결과 유도
      query = query.eq('ts_feeds.expert_id', '00000000-0000-0000-0000-000000000000');
    } else {
      query = query.in('ts_feeds.expert_id', params.expertIds);
    }
  }

  // 5. 기간 필터
  if (params.startDate) {
    query = query.gte('ts_feeds.published_at', params.startDate);
  }
  if (params.endDate) {
    query = query.lte('ts_feeds.published_at', params.endDate);
  }

  // 6. 검색어 필터 (summary_line 및 원문 내용 대상)
  if (params.searchQuery) {
    query = query.or(`summary_line.ilike.%${params.searchQuery}%,ts_feeds.content.ilike.%${params.searchQuery}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('인사이트 조회 실패:', error.message);
    throw new Error(`인사이트 조회 실패: ${error.message}`);
  }

  return (data as any) || [];
};

/**
 * 특정 기간 동안의 종목별 센티먼트 점수 합산 랭킹을 조회합니다.
 * @param {string} startDate 조회 시작 일시 (ISO string)
 * @param {string} endDate 조회 종료 일시 (ISO string)
 * @returns {Promise<StockSentimentRanking[]>} 종목별 점수 랭킹 리스트
 */
export const getStockSentimentRanking = async (
  startDate?: string,
  endDate?: string,
): Promise<StockSentimentRanking[]> => {
  const { data, error } = await supabase.rpc('get_stock_sentiment_ranking_v2', {
    start_date: startDate,
    end_date: endDate,
  });

  if (error) {
    console.error('센티먼트 랭킹 조회 실패:', error.message);
    return [];
  }

  return (data as StockSentimentRanking[]) || [];
};

/**
 * 특정 종목의 상세 분석 인사이트 목록을 조회합니다.
 * @param {string} ticker 종목 티커
 * @param {string} name_ko 종목 한글 이름
 * @param {string} startDate 조회 시작 일시
 * @param {string} endDate 조회 종료 일시
 * @param {number} limit 가져올 개수 (기본 6개)
 * @returns {Promise<InsightWithDetails[]>} 상세 정보를 포함한 인사이트 목록
 */
export const getInsightsByTicker = async (
  ticker: string,
  name_ko: string,
  startDate: string,
  endDate: string,
  limit: number = 6
): Promise<InsightWithDetails[]> => {
  // 티커가 N/A인 경우 이름(name_ko)으로 검색 필터 구성
  const filterJson = ticker !== 'N/A' 
    ? JSON.stringify([{ ticker }])
    : JSON.stringify([{ name_ko }]);

  const { data, error } = await supabase
    .from('ts_insights')
    .select(`
      *,
      ts_feeds!inner (
        *,
        ts_experts!inner (*)
      )
    `)
    .filter('mentioned_stocks', 'cs', filterJson)
    .gte('ts_feeds.published_at', startDate)
    .lte('ts_feeds.published_at', endDate)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error(`${ticker || name_ko} 상세 분석 조회 실패:`, error.message);
    return [];
  }

  return (data as any) || [];
};
