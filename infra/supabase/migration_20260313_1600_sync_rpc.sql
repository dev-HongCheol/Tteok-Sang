-- migration_20260313_1600_sync_rpc.sql
-- 종목 마스터 정보 변경 시 이름 및 별칭을 기반으로 모든 데이터를 병합하고 언급 횟수를 누적하는 함수

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

  -- 2. 병합 대상 티커 리스트 추출
  -- (수정 전 티커 + 이름이 공식명과 같음 + 이름이 별칭 리스트에 포함됨)
  -- 단, 미검증(is_verified = false) 상태인 것들만 흡수 대상으로 간주
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
