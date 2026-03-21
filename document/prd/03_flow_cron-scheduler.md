# PRD: 자동화 스케줄러 설정 (Automation Scheduler)

## 1. 개요
- **목표:** 전문가 피드 수집 및 AI 분석 파이프라인을 정해진 주기마다 자동으로 실행하여 데이터 최신성을 유지하며, 관리자가 웹 UI에서 이 주기를 직접 설정하고 상태를 모니터링할 수 있게 한다.
- **기술 스택:** Supabase Edge Functions, `pg_cron` 익스텐션, Next.js API Routes, `ts_settings` 테이블.

## 2. 사용자 스토리
- "관리자는 시스템 설정 UI에서 수집 주기를 선택(1시간~12시간 사이)할 수 있어야 한다."
- "시스템은 설정된 주기에 맞춰 자동으로 실행되며, UI에 '현재 실행 주기'와 '마지막 동기화 시각'을 실시간으로 표시해야 한다."
- "자동 실행 시, 이전 회차에서 비정상적으로 종료된 로그가 있다면 자동으로 정리하고 새로 시작해야 한다."

## 3. 기술적 상세 및 요구사항

### 3.1 동적 스케줄링 관리
- **설정 저장**: `ts_settings` 테이블의 `sync_interval` 키에 Cron 표현식을 저장한다.
    - 예: `0 * * * *` (1시간), `0 */2 * * *` (2시간) 등.
- **UI 표시 및 설정**: 
    - `SystemSettings` 컴포넌트에서 `select`박스를 통해 주기를 선택하고 `updateSyncIntervalAction` 서버 액션으로 저장한다.
    - `ts_pipeline_logs`에서 가장 최근 '완료'된 기록의 시각을 '마지막 동기화' 정보로 노출한다.
- **트리거 보안**: Edge Function은 `CRON_SECRET_KEY`를 Bearer 토큰으로 검증하여 허가된 호출만 허용한다.

### 3.2 pg_cron 익스텐션 활성화 확인 (Pre-requisite)
크론 작업을 등록하기 전, 데이터베이스에 `pg_cron` 익스텐션이 설치 및 활성화되어 있는지 반드시 확인해야 한다.

```sql
-- 1. 익스텐션 생성 (이미 생성되어 있다면 무시됨)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. 스키마 존재 여부 확인 (에러 발생 시 활성화되지 않은 상태임)
SELECT * FROM cron.job;
```

### 3.3 pg_cron 설정 예시 (SQL)
```sql
-- 설정된 주기에 따라 실행되는 태스크 등록
-- pg_cron이 ts_settings 테이블의 값을 실시간으로 참조하게 하려면 동적 SQL 또는 별도의 업데이트 트리거가 필요함.
-- 현재는 설정 변경 시 관리자가 수동으로 스케줄을 재등록하거나, Edge Function 호출 주기를 상위에서 관리함.
select cron.schedule(
  'sync-pipeline-task',
  '0 * * * *', -- 기본 1시간 정각 (또는 DB 최신값 수동 반영)
  $$ 
  select net.http_post(
    url := 'https://[YOUR_PROJECT_ID].supabase.co/functions/v1/sync-pipeline',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer [YOUR_CRON_SECRET_KEY]'
    )
  )
  $$
);
```

## 4. 단계별 구현 로드맵

### 1단계: 설정 조회 및 표시 UI 개발
- [x] `SystemSettings.tsx`에서 `ts_settings` 및 `ts_pipeline_logs` 실시간 연동.
- [x] 마지막 동기화 시간 포맷팅 및 실시간 표시 로직 구현.

### 2단계: 주기 설정 변경 기능
- [x] 2시간 단위(최대 12시간) 주기 선택용 `select` UI 추가.
- [x] `ts_settings` 값을 업데이트하는 `updateSyncIntervalAction` 서버 액션 구현.

### 3단계: Edge Function 보안 강화
- [x] `CRON_SECRET_KEY` Bearer 토큰 검증 로직 추가.
- [x] 실행 시 상세 로깅 처리.

## 5. 최종 체크리스트 (Validation)
- [x] UI에서 설정한 주기가 DB(`ts_settings`)에 정상적으로 반영되는가?
- [x] 마지막 동기화 시간이 실제 성공 기록과 일치하는가?
- [x] Edge Function 호출 시 유효한 토큰이 없으면 401 에러를 반환하는가?
- [x] 수동 실행 완료 후 마지막 동기화 시각이 즉시 갱신되는가?
