-- Migration: AI 분석 고도화 필드 추가 (2026-03-10)
-- 1단계: 기존 ts_insights 테이블 구조 업데이트

-- 1.1 기존 컬럼 제거
alter table public.ts_insights drop column if exists category;
alter table public.ts_insights drop column if exists summary;

-- 1.2 신규 컬럼 추가 (PostgreSQL은 ADD COLUMN IF NOT EXISTS를 사용해야 함)
alter table public.ts_insights 
  add column if not exists market_type text check (market_type in ('KR', 'US', 'Global')),
  add column if not exists mentioned_stocks jsonb default '[]'::jsonb,
  add column if not exists is_explicit boolean default true,
  add column if not exists sectors text[] default '{}'::text[],
  add column if not exists sentiment_direction text check (sentiment_direction in ('Bullish', 'Bearish', 'Neutral')),
  add column if not exists sentiment_intensity int check (sentiment_intensity >= 1 and sentiment_intensity <= 5),
  add column if not exists investment_horizon text check (investment_horizon in ('intraday', 'swing', 'long-term')),
  add column if not exists confidence_level text check (confidence_level in ('low', 'medium', 'high')),
  add column if not exists logic_type text[] default '{}'::text[],
  add column if not exists summary_line text;

-- 1.3 코멘트 추가
comment on column public.ts_insights.market_type is '시장 분류 (KR, US, Global)';
comment on column public.ts_insights.mentioned_stocks is '언급된 종목 리스트 [{ticker, name_ko}]';
comment on column public.ts_insights.is_explicit is '종목명 직접 명시 여부';
comment on column public.ts_insights.sectors is '관련 섹터 리스트 (다중 태그)';
comment on column public.ts_insights.sentiment_direction is '투자 방향성 (Bullish, Bearish, Neutral)';
comment on column public.ts_insights.sentiment_intensity is '관점 강도 (1~5)';
comment on column public.ts_insights.investment_horizon is '투자 시계 (intraday, swing, long-term)';
comment on column public.ts_insights.confidence_level is 'AI 판단 확신도';
comment on column public.ts_insights.logic_type is '판단 근거 유형 리스트';
comment on column public.ts_insights.summary_line is '핵심 논리 1줄 요약';

-- 1.4 검색 성능을 위한 인덱스 추가
create index if not exists idx_ts_insights_market_type on public.ts_insights(market_type);
create index if not exists idx_ts_insights_sectors on public.ts_insights using gin(sectors);
