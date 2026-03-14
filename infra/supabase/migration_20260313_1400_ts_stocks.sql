-- migration_20260313_1400_ts_stocks.sql
-- Create ts_stocks table as a Source of Truth for tickers and names

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

-- Seed data for major stocks (Verified)
insert into public.ts_stocks (ticker, name_ko, market_type, aliases, is_verified)
values 
  -- US Tech (Magnificent 7 + Hot)
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
  -- KR Tech
  ('005930', '삼성전자', 'KR', '{Samsung}', true),
  ('000660', 'SK하이닉스', 'KR', '{Hynix, 하이닉스}', true),
  ('035420', 'NAVER', 'KR', '{네이버}', true),
  ('035720', '카카오', 'KR', '{Kakao}', true),
  ('373220', 'LG에너지솔루션', 'KR', '{LG엔솔}', true)
on conflict (ticker) do update set 
  name_ko = excluded.name_ko, 
  market_type = excluded.market_type,
  aliases = excluded.aliases,
  is_verified = excluded.is_verified;

-- Create index for faster alias searching
create index if not exists idx_ts_stocks_aliases on public.ts_stocks using gin(aliases);
create index if not exists idx_ts_stocks_is_verified on public.ts_stocks(is_verified);
