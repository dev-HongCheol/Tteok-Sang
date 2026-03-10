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

comment on table public.ts_pipeline_logs is '데이터 파이프라인 실행 이력 로그 (샘플 데이터 포함)';
