/**
 * AI 분석 인사이트(Insight) 엔티티와 관련된 데이터 타입을 정의합니다.
 */

/** 인사이트의 중요도 레벨 */
export type ImportanceLevel = 'Low' | 'Medium' | 'High';

/** 시장 분류 (한국, 미국, 글로벌) */
export type MarketType = 'KR' | 'US' | 'Global';

/** 투자 관점의 방향성 (긍정, 부정, 중립) */
export type SentimentDirection = 'Bullish' | 'Bearish' | 'Neutral';

/** 권장 투자 기간/호흡 */
export type InvestmentHorizon = 'intraday' | 'swing' | 'long-term';

/** AI 판단의 확신도 */
export type ConfidenceLevel = 'low' | 'medium' | 'high';

/** 언급되거나 추론된 종목 정보 */
export interface MentionedStock {
  /** 종목 티커 (예: NVDA, 005930) */
  ticker: string;
  /** 공식 한글 종목명 (예: 엔비디아, 삼성전자) */
  name_ko: string;
}

/** Gemini AI가 분석한 피드별 상세 인사이트 엔티티 */
export interface Insight {
  /** 인사이트 고유 ID (UUID) */
  id: string;
  /** 연결된 원본 피드 ID */
  feed_id: string;
  /** 경제/주식 관련성 점수 (0~100) */
  relevance_score: number;
  /** 인사이트의 중요도 */
  importance: ImportanceLevel | null;
  /** 대상 시장 분류 */
  market_type: MarketType | null;
  /** 언급된 종목 리스트 */
  mentioned_stocks: MentionedStock[] | null;
  /** 종목명 직접 명시 여부 (false일 경우 맥락 추론) */
  is_explicit: boolean | null;
  /** 관련 섹터 태그 리스트 */
  sectors: string[] | null;
  /** 투자 방향성 */
  sentiment_direction: SentimentDirection | null;
  /** 관점의 강도 (1: 매우 약함 ~ 5: 매우 강함) */
  sentiment_intensity: number | null;
  /** 투자 시계/호흡 */
  investment_horizon: InvestmentHorizon | null;
  /** AI 판단 확신도 */
  confidence_level: ConfidenceLevel | null;
  /** 판단 근거 유형 리스트 (valuation, momentum 등) */
  logic_type: string[] | null;
  /** 핵심 논리를 담은 정교한 1줄 요약 */
  summary_line: string | null;
  /** 생성 일시 */
  created_at: string;
}

/** 인사이트 생성을 위한 데이터 타입 */
export type CreateInsight = Omit<Insight, 'id' | 'created_at'>;
