-- Tteok-Sang (떡상) Data Reset & Seed Script
-- Last Updated: 2026-03-13

-- 1. 모든 테이블 초기화 (외래키 제약조건 고려하여 Cascade 삭제)
truncate table public.ts_pipeline_logs cascade;
truncate table public.ts_settings cascade;
truncate table public.ts_insights cascade;
truncate table public.ts_feeds cascade;
truncate table public.ts_experts cascade;
truncate table public.ts_stocks cascade;

-- 2. 시스템 기본 설정 (Seed Settings)
insert into public.ts_settings (key, value)
values ('sync_interval', '0 * * * *');

-- 3. 주요 상장사 마스터 데이터 (Seed Stocks - Verified)
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
  ('373220', 'LG에너지솔루션', 'KR', '{LG엔솔}', true);

comment on table public.ts_stocks is '초기화 스크립트로 생성된 표준 종목 마스터 데이터';
