-- [Migration] 전수 인사이트 정규화 함수 및 복구 로직
-- Date: 2026-03-18

/**
 * 모든 인사이트 데이터를 순회하며 ts_stocks 마스터 테이블 기준으로 
 * mentioned_stocks 정보를 최신화(정규화)합니다.
 */
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
  -- 1. 이름 매칭을 통해 티커가 다르거나 검증 상태가 다른 모든 인사이트 데이터 일괄 업데이트
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
