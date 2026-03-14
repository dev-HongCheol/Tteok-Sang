-- migration_20260313_1700_refresh_counts.sql
-- 실제 분석 데이터(ts_insights)를 바탕으로 모든 종목의 언급 횟수를 재계산하는 함수

create or replace function public.refresh_all_stock_counts()
returns void
language plpgsql
security definer
as $$
begin
  -- ts_stocks 테이블의 모든 종목에 대해 실제 언급된 횟수를 카운트하여 업데이트
  -- 안전 모드 우회를 위해 WHERE 절 추가
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

-- 실행 권한 부여
comment on function public.refresh_all_stock_counts is '실제 인사이트 데이터를 기반으로 종목별 누적 언급 횟수 전수 재계산';
