-- 최근 24시간 종목별 센티먼트 집계 함수 생성
create or replace function public.get_stock_sentiment_ranking(hours_ago int default 24)
returns table (
  ticker text,
  name_ko text,
  total_score bigint,
  mention_count bigint,
  avg_intensity numeric
) 
language sql
security invoker
as $$
  with stock_mentions as (
    select 
      stock->>'ticker' as ticker,
      stock->>'name_ko' as name_ko,
      case 
        when sentiment_direction = 'Bullish' then sentiment_intensity 
        when sentiment_direction = 'Bearish' then -sentiment_intensity 
        else 0 
      end as score,
      sentiment_intensity as intensity
    from public.ts_insights,
         jsonb_array_elements(mentioned_stocks) as stock
    where created_at >= now() - (hours_ago || ' hours')::interval
  )
  select 
    ticker,
    name_ko,
    sum(score) as total_score,
    count(*) as mention_count,
    round(avg(intensity), 2) as avg_intensity
  from stock_mentions
  group by ticker, name_ko
  order by total_score desc, mention_count desc;
$$;

comment on function public.get_stock_sentiment_ranking is '최근 N시간 동안의 종목별 센티먼트 점수 및 언급 횟수 집계';
