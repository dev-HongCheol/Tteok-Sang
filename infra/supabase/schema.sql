-- Tteok-Sang (떡상) Database Schema
-- Last Updated: 2026-03-12

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. ts_experts (Expert profile information)
create table if not exists public.ts_experts (
  id uuid primary key default uuid_generate_v4(),
  twitter_handle text unique not null,
  name text not null,
  last_synced_at timestamptz,
  created_at timestamptz default now()
);

comment on table public.ts_experts is '인사이트를 제공하는 전문가 프로필 정보';
comment on column public.ts_experts.twitter_handle is '전문가의 트위터(X) 핸들 아이디';
comment on column public.ts_experts.name is '전문가 표시 이름';
comment on column public.ts_experts.last_synced_at is '마지막으로 피드를 동기화한 시점 (증분 수집용)';
comment on column public.ts_experts.created_at is '데이터 생성 일시';

-- 2. ts_feeds (Raw tweets/feeds collected from Nitter)
create table if not exists public.ts_feeds (
  id uuid primary key default uuid_generate_v4(),
  expert_id uuid references public.ts_experts(id) on delete cascade not null,
  tweet_id text unique not null,
  content text not null,
  published_at timestamptz not null,
  raw_data jsonb,
  created_at timestamptz default now()
);

comment on table public.ts_feeds is 'Nitter를 통해 수집된 트윗 원본 데이터';
comment on column public.ts_feeds.expert_id is '해당 피드를 작성한 전문가 ID (ts_experts 외래키)';
comment on column public.ts_feeds.tweet_id is '트위터(X) 고유 트윗 ID';
comment on column public.ts_feeds.content is '트윗 본문 내용';
comment on column public.ts_feeds.published_at is '트윗이 실제 작성된 시점';
comment on column public.ts_feeds.raw_data is '수집 시점의 RSS 원본 데이터 전체 (JSON)';
comment on column public.ts_feeds.created_at is 'DB 저장 일시';

-- 3. ts_insights (AI analysis results of feeds)
create table if not exists public.ts_insights (
  id uuid primary key default uuid_generate_v4(),
  feed_id uuid references public.ts_feeds(id) on delete cascade not null unique,
  relevance_score int check (relevance_score >= 0 and relevance_score <= 100),
  importance text check (importance in ('Low', 'Medium', 'High')),
  market_type text check (market_type in ('KR', 'US', 'Global')),
  mentioned_stocks jsonb default '[]'::jsonb,
  is_explicit boolean default true,
  sectors text[] default '{}'::text[],
  sentiment_direction text check (sentiment_direction in ('Bullish', 'Bearish', 'Neutral')),
  sentiment_intensity int check (sentiment_intensity >= 1 and sentiment_intensity <= 5),
  investment_horizon text check (investment_horizon in ('intraday', 'swing', 'long-term')),
  confidence_level text check (confidence_level in ('low', 'medium', 'high')),
  logic_type text[] default '{}'::text[],
  summary_line text,
  created_at timestamptz default now()
);

comment on table public.ts_insights is 'Gemini AI가 분석한 피드별 경제 인사이트 정보';
comment on column public.ts_insights.feed_id is '분석 대상 피드 ID (ts_feeds 외래키)';
comment on column public.ts_insights.relevance_score is '경제/주식 관련성 점수 (0~100)';
comment on column public.ts_insights.importance is '인사이트의 중요도 (Low, Medium, High)';
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
comment on column public.ts_insights.created_at is '분석 및 생성 일시';

-- 4. ts_settings (System configurations)
create table if not exists public.ts_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);

comment on table public.ts_settings is '시스템 전역 설정 정보';
comment on column public.ts_settings.key is '설정 식별 키 (예: sync_interval)';
comment on column public.ts_settings.value is '설정 값 (JSON 또는 문자열)';

-- 5. ts_pipeline_logs (Execution history)
create table if not exists public.ts_pipeline_logs (
  id uuid primary key default uuid_generate_v4(),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  status text check (status in ('완료', '수집 오류', '분석 오류', '진행중', 'success', 'error')),
  collected_count int default 0,
  analyzed_count int default 0,
  error_message text,
  created_at timestamptz default now()
);

comment on table public.ts_pipeline_logs is '데이터 파이프라인 실행 이력 로그';
comment on column public.ts_pipeline_logs.status is '실행 결과 상태 (완료, 수집 오류, 분석 오류, 진행중)';
comment on column public.ts_pipeline_logs.collected_count is '해당 실행 회차에서 수집된 신규 피드 수';
comment on column public.ts_pipeline_logs.analyzed_count is '해당 실행 회차에서 분석 완료된 인사이트 수';

-- 6. Functions & RPCs
-- 기존 구버전 함수 삭제 (안전한 전환을 위해 명시적으로 실행 권장)
-- drop function if exists public.get_stock_sentiment_ranking(int);
-- drop function if exists public.get_stock_sentiment_ranking_v2(timestamptz, timestamptz);

-- 특정 기간 동안의 종목별 센티먼트 집계 함수 (최종본)
create or replace function public.get_stock_sentiment_ranking(
  start_date timestamptz default now() - interval '24 hours',
  end_date timestamptz default now()
)
returns table (
  ticker text,
  name_ko text,
  sector text,
  total_score bigint,
  mention_count bigint,
  avg_intensity numeric
) 
language sql
security invoker
as $$
  with stock_mentions as (
    select 
      -- 티커가 N/A면 이름을 ID로 사용 (하이브리드 그룹화 키)
      coalesce(nullif(stock->>'ticker', 'N/A'), stock->>'name_ko') as group_id,
      stock->>'ticker' as orig_ticker,
      stock->>'name_ko' as orig_name_ko,
      -- 첫 번째 섹터를 대표 섹터로 사용 (없으면 '기타')
      coalesce(i.sectors[1], '기타') as orig_sector,
      case 
        when i.sentiment_direction = 'Bullish' then i.sentiment_intensity 
        when i.sentiment_direction = 'Bearish' then -i.sentiment_intensity 
        else 0 
      end as score,
      i.sentiment_intensity as intensity,
      f.published_at
    from public.ts_insights i
    join public.ts_feeds f on i.feed_id = f.id,
         jsonb_array_elements(i.mentioned_stocks) as stock
    where f.published_at >= start_date 
      and f.published_at <= end_date
  ),
  ranked_mentions as (
    select 
      group_id,
      -- 그룹 내에서 가장 최근에 들어온 티커와 이름을 대표값으로 선택
      first_value(orig_ticker) over (partition by group_id order by published_at desc) as final_ticker,
      first_value(orig_name_ko) over (partition by group_id order by published_at desc) as final_name_ko,
      first_value(orig_sector) over (partition by group_id order by published_at desc) as final_sector,
      score,
      intensity
    from stock_mentions
  )
  select 
    max(final_ticker) as ticker,
    max(final_name_ko) as name_ko,
    max(final_sector) as sector,
    sum(score) as total_score,
    count(*) as mention_count,
    round(avg(intensity), 2) as avg_intensity
  from ranked_mentions
  group by group_id
  order by total_score desc, mention_count desc;
$$;

comment on function public.get_stock_sentiment_ranking is '특정 시작일~종료일 사이의 종목별 센티먼트 점수 및 언급 횟수 집계';

-- Default Seeds
insert into public.ts_settings (key, value)
values ('sync_interval', '0 * * * *')
on conflict (key) do nothing;

-- Performance Indexes
create index if not exists idx_ts_experts_last_synced_at on public.ts_experts(last_synced_at);
create index if not exists idx_ts_feeds_expert_id on public.ts_feeds(expert_id);
create index if not exists idx_ts_insights_feed_id on public.ts_insights(feed_id);
create index if not exists idx_ts_insights_market_type on public.ts_insights(market_type);
create index if not exists idx_ts_insights_sectors on public.ts_insights using gin(sectors);
create index if not exists idx_ts_pipeline_logs_started_at on public.ts_pipeline_logs(started_at);
