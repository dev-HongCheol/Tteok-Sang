-- Tteok-Sang (떡상) Data Reset & Seed Script
-- Last Updated: 2026-03-09

-- 1. Truncate all tables with Cascade to handle Foreign Keys
-- This will safely delete all data and reset the state.
truncate table public.ts_pipeline_logs cascade;
truncate table public.ts_settings cascade;
truncate table public.ts_insights cascade;
truncate table public.ts_feeds cascade;
truncate table public.ts_experts cascade;

-- 2. Seed Default Settings
insert into public.ts_settings (key, value)
values ('sync_interval', '0 * * * *');

-- 3. Seed Sample Experts (For UI Test)
insert into public.ts_experts (twitter_handle, name, last_synced_at)
values 
  ('Alisvolatprop12', '알리스', now() - interval '30 minutes'),
  ('elonmusk', '일론머스크', now() - interval '1 hour'),
  ('investingcom', '인베스팅닷컴', now() - interval '2 hours');

-- 4. Seed Sample Pipeline Logs (For Dashboard Test)
insert into public.ts_pipeline_logs (status, collected_count, analyzed_count, started_at, ended_at)
values 
  ('success', 15, 12, now() - interval '1 hour', now() - interval '55 minutes'),
  ('success', 8, 8, now() - interval '2 hours', now() - interval '1 hour 50 minutes'),
  ('error', 0, 0, now() - interval '3 hours', now() - interval '2 hour 59 minutes', 'Nitter 인스턴스 접속 실패 (CORS 에러 아님)');

comment on table public.ts_pipeline_logs is '데이터 파이프라인 실행 이력 로그 (샘플 데이터 포함)';
