-- Migration: Add System Settings and Pipeline Logs
-- Created At: 2026-03-09 16:40

-- 1. ts_settings (System configurations like sync interval)
create table if not exists public.ts_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);

comment on table public.ts_settings is '시스템 전역 설정 정보';
comment on column public.ts_settings.key is '설정 식별 키 (예: sync_interval)';
comment on column public.ts_settings.value is '설정 값 (JSON 또는 문자열)';

-- 2. ts_pipeline_logs (Execution history of the sync pipeline)
create table if not exists public.ts_pipeline_logs (
  id uuid primary key default uuid_generate_v4(),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  status text check (status in ('success', 'error')),
  collected_count int default 0,
  analyzed_count int default 0,
  error_message text,
  created_at timestamptz default now()
);

comment on table public.ts_pipeline_logs is '데이터 파이프라인 실행 이력 로그';
comment on column public.ts_pipeline_logs.status is '실행 결과 상태 (success, error)';
comment on column public.ts_pipeline_logs.collected_count is '해당 실행 회차에서 수집된 신규 피드 수';
comment on column public.ts_pipeline_logs.analyzed_count is '해당 실행 회차에서 분석 완료된 인사이트 수';

-- 3. Insert default settings
insert into public.ts_settings (key, value)
values ('sync_interval', '0 * * * *') -- 매 시간 정각 (Cron)
on conflict (key) do nothing;
