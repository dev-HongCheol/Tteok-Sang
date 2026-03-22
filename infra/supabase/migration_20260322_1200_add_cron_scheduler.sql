-- Migration: Add pg_cron automation for sync pipeline
-- Date: 2026-03-22
-- Description: ts_settings의 sync_interval 변경 시 pg_cron 스케줄을 자동으로 갱신하는 트리거 시스템 추가

-- 1. Enable pg_cron extension
create extension if not exists pg_cron;

-- 2. Create function to sync cron schedule from settings
create or replace function public.sync_cron_schedule_from_settings()
returns trigger
language plpgsql
security definer
as $$
begin
  -- sync_interval 키에 대해서만 동작
  if new.key != 'sync_interval' then
    return new;
  end if;

  -- 기존 태스크가 있다면 삭제 (작업이 없어도 에러가 나지 않도록 예외 처리)
  begin
    perform cron.unschedule('sync-pipeline-task');
  exception when others then
    null;
  end;

  -- 새 스케줄 등록
  perform cron.schedule(
    'sync-pipeline-task',
    new.value,
    format(
      'select net.http_post(url := ''https://supa.devhong.cc/functions/v1/sync-pipeline'', headers := ''{"Content-Type": "application/json"}''::jsonb)',
      ''
    )
  );

  return new;
end;
$$;

-- 3. Create trigger on ts_settings
drop trigger if exists tr_sync_cron_schedule on public.ts_settings;
create trigger tr_sync_cron_schedule
after insert or update on public.ts_settings
for each row
execute function public.sync_cron_schedule_from_settings();

-- 4. Initial registration trigger
-- 현재 설정된 값을 기준으로 크론 작업을 즉시 생성하기 위해 강제 업데이트 수행
update public.ts_settings
set value = value
where key = 'sync_interval';
