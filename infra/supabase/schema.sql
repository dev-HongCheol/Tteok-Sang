-- Tteok-Sang (떡상) Database Schema
-- Last Updated: 2026-03-18

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
comment on column public.ts_insights.mentioned_stocks is '언급된 종목 리스트 [{ticker, name_ko, is_verified}]';
comment on column public.ts_insights.is_explicit is '종목명 직접 명시 여부';
comment on column public.ts_insights.sectors is '관련 섹터 리스트 (다중 태그)';
comment on column public.ts_insights.sentiment_direction is '투자 방향성 (Bullish, Bearish, Neutral)';
comment on column public.ts_insights.sentiment_intensity is '관점 강도 (1~5)';
comment on column public.ts_insights.investment_horizon is '투자 시계 (intraday, swing, long-term)';
comment on column public.ts_insights.confidence_level is 'AI 판단 확신도';
comment on column public.ts_insights.logic_type is '판단 근거 유형 리스트';
comment on column public.ts_insights.summary_line is '핵심 논리 1줄 요약';
comment on column public.ts_insights.created_at is '분석 및 생성 일시';

-- 4. ts_stocks (Stock Master Data)
create table if not exists public.ts_stocks (
  ticker text primary key,
  name_ko text not null,
  market_type text check (market_type in ('KR', 'US', 'Global')),
  aliases text[] default '{}',
  is_verified boolean default false,
  mention_count int default 0,
  created_at timestamptz default now()
);

comment on table public.ts_stocks is '표준화된 종목 마스터 정보 (티커-한글명 매핑)';
comment on column public.ts_stocks.ticker is '종목 공식 티커 (식별자)';
comment on column public.ts_stocks.name_ko is '공식 한글 종목명';
comment on column public.ts_stocks.market_type is '상장 시장 분류';
comment on column public.ts_stocks.aliases is '오타, 영문명 등 매칭용 별칭 리스트';
comment on column public.ts_stocks.is_verified is '관리자 검증 완료 여부';
comment on column public.ts_stocks.mention_count is '누적 언급 횟수';

-- 5. ts_settings (System configurations)
create table if not exists public.ts_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);

comment on table public.ts_settings is '시스템 전역 설정 정보';
comment on column public.ts_settings.key is '설정 식별 키 (예: sync_interval)';
comment on column public.ts_settings.value is '설정 값 (Cron 표현식 등)';

-- 6. ts_pipeline_logs (Execution history)
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

-- 7. Functions & RPCs

-- [RPC] 특정 기간 동안의 종목별 센티먼트 집계 함수 (런타임 정규화 적용)
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
      -- [런타임 정규화] 마스터 데이터(ts_stocks)에 매칭되는 정보가 있으면 그것을 최우선으로 사용
      coalesce(s.ticker, nullif(stock->>'ticker', 'N/A'), stock->>'name_ko') as group_id,
      coalesce(s.ticker, stock->>'ticker') as final_ticker,
      coalesce(s.name_ko, stock->>'name_ko') as final_name_ko,
      -- 첫 번째 섹터를 대표 섹터로 사용
      coalesce(i.sectors[1], '기타') as orig_sector,
      case 
        when i.sentiment_direction = 'Bullish' then i.sentiment_intensity 
        when i.sentiment_direction = 'Bearish' then -i.sentiment_intensity 
        else 0 
      end as score,
      i.sentiment_intensity as intensity,
      f.published_at
    from public.ts_insights i
    join public.ts_feeds f on i.feed_id = f.id
    cross join lateral jsonb_array_elements(i.mentioned_stocks) as stock
    -- [핵심] 마스터 테이블과 실시간 조인 (티커 또는 이름으로 매칭)
    left join public.ts_stocks s on (s.ticker = stock->>'ticker' or s.name_ko = stock->>'name_ko')
    where f.published_at >= start_date 
      and f.published_at <= end_date
  ),
  ranked_mentions as (
    select 
      group_id,
      -- 그룹 내에서 가장 최근 데이터를 대표값으로 선택
      first_value(final_ticker) over (partition by group_id order by published_at desc) as representative_ticker,
      first_value(final_name_ko) over (partition by group_id order by published_at desc) as representative_name_ko,
      first_value(orig_sector) over (partition by group_id order by published_at desc) as final_sector,
      score,
      intensity
    from stock_mentions
  )
  select 
    max(representative_ticker) as ticker,
    max(representative_name_ko) as name_ko,
    max(final_sector) as sector,
    sum(score) as total_score,
    count(*) as mention_count,
    round(avg(intensity), 2) as avg_intensity
  from ranked_mentions
  group by group_id
  order by total_score desc, mention_count desc;
$$;

-- [RPC] 종목 마스터 정보 변경 시 이름/별칭 기반 모든 데이터를 병합하고 언급 횟수를 누적하는 함수
create or replace function public.sync_stock_normalization(
  old_ticker_val text,
  new_ticker_val text,
  new_name_ko_val text
)
returns void
language plpgsql
security definer
as $$
declare
  target_tickers text[];
  total_mentions int;
  current_aliases text[];
begin
  -- 1. 목표 종목의 현재 별칭 리스트 가져오기
  select aliases into current_aliases
  from public.ts_stocks
  where ticker = new_ticker_val;

  -- 2. 병합 대상 티커 리스트 및 언급 횟수 합계 추출
  -- (수정 전 티커 + 이름 일치 + 별칭에 포함된 미검증 종목들 일괄 수집)
  select 
    array_agg(ticker), 
    sum(coalesce(mention_count, 0))
  into target_tickers, total_mentions
  from public.ts_stocks
  where (ticker = old_ticker_val)
     or (ticker = new_ticker_val)
     or (is_verified = false and (
          name_ko = new_name_ko_val or 
          name_ko = any(current_aliases)
        ));

  if target_tickers is null then return; end if;

  -- 3. ts_insights 테이블의 JSON 데이터 소급 업데이트
  update public.ts_insights
  set mentioned_stocks = (
    select jsonb_agg(
      case 
        when stock->>'ticker' = any(target_tickers) then 
          jsonb_build_object(
            'ticker', new_ticker_val,
            'name_ko', new_name_ko_val,
            'is_verified', true
          )
        else stock
      end
    )
    from jsonb_array_elements(mentioned_stocks) as stock
  )
  where exists (
    select 1 from jsonb_array_elements(mentioned_stocks) s 
    where s->>'ticker' = any(target_tickers)
  );

  -- 4. 언급 횟수 합산 반영 (승인 처리는 호출 측에서 직접 제어하도록 분리)
  update public.ts_stocks
  set mention_count = total_mentions
  where ticker = new_ticker_val;

  -- 5. 흡수된 나머지 임시 레코드들 삭제
  delete from public.ts_stocks
  where ticker = any(target_tickers)
    and ticker != new_ticker_val;
end;
$$;

-- [RPC] 마스터 데이터 변경 시 과거 모든 인사이트의 JSON 스냅샷을 전수 조사하여 최신 정보로 강제 동기화하는 함수
create or replace function public.global_rebalance_insights()
returns table (
  processed_count int
) 
language plpgsql
security definer
as $$
declare
  updated_row_count int;
begin
  -- 이름 매칭을 통해 티커가 다르거나 검증 상태가 다른 모든 인사이트 데이터 일괄 업데이트
  with updated_data as (
    update public.ts_insights i
    set mentioned_stocks = (
      select jsonb_agg(
        case 
          when s.ticker is not null then 
            jsonb_build_object(
              'ticker', s.ticker,
              'name_ko', s.name_ko,
              'is_verified', s.is_verified
            )
          else elem
        end
      )
      from jsonb_array_elements(i.mentioned_stocks) as elem
      left join public.ts_stocks s on (s.name_ko = elem->>'name_ko' or s.aliases @> array[elem->>'name_ko'])
    )
    where exists (
      -- 마스터와 정보가 다른 요소가 하나라도 있는 행만 필터링 (성능 최적화)
      select 1 
      from jsonb_array_elements(i.mentioned_stocks) as elem
      join public.ts_stocks s on (s.name_ko = elem->>'name_ko' or s.aliases @> array[elem->>'name_ko'])
      where elem->>'ticker' != s.ticker 
         or (elem->>'is_verified')::boolean != s.is_verified
    )
    returning 1
  )
  select count(*) into updated_row_count from updated_data;

  return query select updated_row_count;
end;
$$;

-- [RPC] 실제 데이터 기반 언급 횟수 전수 재계산 함수
create or replace function public.refresh_all_stock_counts()
returns void
language plpgsql
security definer
as $$
begin
  update public.ts_stocks s
  set mention_count = (
    select count(*)
    from public.ts_insights i,
         jsonb_array_elements(i.mentioned_stocks) as stock
    where stock->>'ticker' = s.ticker
  )
  where s.ticker is not null;
end;
$$;

-- [RPC] 특정 종목의 언급 횟수를 1 증가시키는 함수
create or replace function public.increment_stock_mention(stock_ticker text)
returns void
language plpgsql
security definer
as $$
begin
  update public.ts_stocks
  set mention_count = coalesce(mention_count, 0) + 1
  where ticker = stock_ticker;
end;
$$;

-- Default Seeds
insert into public.ts_settings (key, value)
values ('sync_interval', '0 * * * *')
on conflict (key) do nothing;

-- Seed data for major stocks (Verified)
insert into public.ts_stocks (ticker, name_ko, market_type, aliases, is_verified)
values 
  ('NVDA', '엔비디아', 'US', '{Nvidia, NVDIA}', true),
  ('TSLA', '테슬라', 'US', '{Tesla, TSLS}', true),
  ('AAPL', '애플', 'US', '{Apple}', true),
  ('MSFT', '마이크로소프트', 'US', '{Microsoft}', true),
  ('AMZN', '아마존', 'US', '{Amazon}', true),
  ('GOOGL', '구글', 'US', '{Google, Alphabet}', true),
  ('META', '메타', 'US', '{Meta, Facebook}', true),
  ('SMCI', '슈퍼마이크로컴퓨터', 'US', '{Supermicro, SMC}', true),
  ('PLTR', '팔란티어', 'US', '{Palantir}', true),
  ('ARM', 'ARM', 'US', '{Arm Holdings}', true),
  ('MSTR', '마이크로스트래티지', 'US', '{MicroStrategy}', true),
  ('COIN', '코인베이스', 'US', '{Coinbase}', true),
  ('005930', '삼성전자', 'KR', '{Samsung}', true),
  ('000660', 'SK하이닉스', 'KR', '{Hynix, 하이닉스}', true),
  ('035420', 'NAVER', 'KR', '{네이버}', true),
  ('035720', '카카오', 'KR', '{Kakao}', true),
  ('373220', 'LG에너지솔루션', 'KR', '{LG엔솔}', true)
on conflict (ticker) do nothing;

-- Performance Indexes
create index if not exists idx_ts_experts_last_synced_at on public.ts_experts(last_synced_at);
create index if not exists idx_ts_feeds_expert_id on public.ts_feeds(expert_id);
create index if not exists idx_ts_insights_feed_id on public.ts_insights(feed_id);
create index if not exists idx_ts_insights_market_type on public.ts_insights(market_type);
create index if not exists idx_ts_insights_sectors on public.ts_insights using gin(sectors);
create index if not exists idx_ts_stocks_aliases on public.ts_stocks using gin(aliases);
create index if not exists idx_ts_stocks_is_verified on public.ts_stocks(is_verified);
create index if not exists idx_ts_pipeline_logs_started_at on public.ts_pipeline_logs(started_at);
