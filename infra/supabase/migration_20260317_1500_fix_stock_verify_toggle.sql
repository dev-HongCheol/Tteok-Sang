-- [Migration] Fix: is_verified toggle not working in Stock Master management
-- Date: 2026-03-17
-- Description: Remove automatic is_verified = true update from sync_stock_normalization RPC 
--              to allow manual control of verification status.

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
  -- (인사이트 내의 개별 종목 데이터는 정규화된 마스터 정보를 따라야 하므로 is_verified: true 유지)
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

  -- 4. 언급 횟수 합산 반영 (승인 처리는 호출 측인 updateStock API에서 직접 제어하도록 분리)
  update public.ts_stocks
  set mention_count = total_mentions
  where ticker = new_ticker_val;

  -- 5. 흡수된 나머지 임시 레코드들 삭제
  delete from public.ts_stocks
  where ticker = any(target_tickers)
    and ticker != new_ticker_val;
end;
$$;
