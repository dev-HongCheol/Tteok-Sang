-- migration_20260313_1800_advanced_normalization.sql
-- 1. 집계 함수 고도화 (런타임 정규화 적용)
-- 2. 동기화 함수 고도화 (언급 횟수 누적 및 병합 로직)
-- 3. 전체 카운트 재계산 함수 추가

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
      -- 마스터 데이터(ts_stocks)에 매칭되는 정보가 있으면 그것을 최우선으로 사용 (런타임 정규화)
      coalesce(s.ticker, nullif(stock->>'ticker', 'N/A'), stock->>'name_ko') as group_id,
      coalesce(s.ticker, stock->>'ticker') as final_ticker,
      coalesce(s.name_ko, stock->>'name_ko') as final_name_ko,
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
    -- 마스터 테이블과 실시간 조인 (티커 또는 이름으로 매칭)
    left join public.ts_stocks s on (s.ticker = stock->>'ticker' or s.name_ko = stock->>'name_ko')
    where f.published_at >= start_date 
      and f.published_at <= end_date
  ),
  ranked_mentions as (
    select 
      group_id,
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

-- [RPC] 종목 마스터 정보 변경 시 기존 인사이트 데이터를 소급하여 병합하고 언급 횟수를 누적하는 함수
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
  -- (수정 전 티커 + 동일 이름을 가진 모든 미검증 티커들 + 별칭에 포함된 미검증 종목들)
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

  -- 4. 언급 횟수 합산 반영 및 승인 처리
  update public.ts_stocks
  set 
    mention_count = total_mentions,
    is_verified = true
  where ticker = new_ticker_val;

  -- 5. 흡수된 나머지 임시 레코드들 삭제
  delete from public.ts_stocks
  where ticker = any(target_tickers)
    and ticker != new_ticker_val;
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
  where s.ticker is not null; -- 안전 모드 우회
end;
$$;

-- 설명 추가
comment on function public.get_stock_sentiment_ranking is '런타임 정규화가 적용된 종목별 센티먼트 집계';
comment on function public.sync_stock_normalization is '티커/별칭 변경 시 과거 데이터 일괄 동기화 및 중복 미검증 종목 병합';
comment on function public.refresh_all_stock_counts is '실제 인사이트 데이터를 기반으로 종목별 누적 언급 횟수 전수 재계산';
