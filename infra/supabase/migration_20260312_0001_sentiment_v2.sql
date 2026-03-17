-- 기존 구버전 함수 삭제 (안전한 전환을 위해)
drop function if exists public.get_stock_sentiment_ranking(int);
drop function if exists public.get_stock_sentiment_ranking_v2(timestamptz, timestamptz);

-- 특정 기간(시작일~종료일) 동안의 종목별 센티먼트 집계 함수 (최종 개선판)
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
