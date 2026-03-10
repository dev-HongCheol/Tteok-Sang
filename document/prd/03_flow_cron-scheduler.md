# PRD: 자동화 스케줄러 설정 (Automation Scheduler)

## 1. 개요
- **목표:** 관리자가 매번 수동으로 실행하지 않아도, 시스템이 정해진 주기마다 자동으로 피드를 수집하고 분석하도록 설정한다.
- **기술 스택:** Supabase Edge Functions, `pg_cron` 익스텐션.

## 2. 사용자 스토리
- "시스템은 매 시간 정각에 자동으로 파이프라인을 실행해야 한다."
- "자동 실행 결과(성공/실패 여부, 처리 건수)는 `ts_pipeline_logs` 테이블에 기록되어야 한다."

## 3. 기술적 상세 및 요구사항

### 3.1 Edge Function (`sync-pipeline`)
- **역할:** `runFullPipeline()` 함수를 호출하는 엔드포인트 제공.
- **보안:** 외부의 무분별한 호출을 막기 위해 `Authorization` 헤더의 Bearer 토큰(Secret Key)을 검증.

### 3.2 pg_cron 설정
- **기능:** PostgreSQL 내부에서 특정 시간에 HTTP 요청(Edge Function 호출)을 보내는 스케줄러.
- **명령어 예시:**
  ```sql
  select cron.schedule(
    'sync-pipeline-every-hour',
    '0 * * * *',
    $$ select net.http_post(
         url:='https://[project].supabase.co/functions/v1/sync-pipeline',
         headers:=jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer [YOUR_SECRET_KEY]')
       ) $$
  );
  ```

## 4. 단계별 구현 로드맵

### 1단계: Edge Function 개발 및 배포
- [x] `supabase/functions/sync-pipeline/index.ts` 작성.
- [x] 로컬 환경에서 `supabase functions serve`로 테스트.

### 2단계: Supabase 인프라 설정
- [ ] Docker Compose 환경 변수 설정 및 컨테이너 재시작.
- [ ] Supabase SQL Editor를 통해 `pg_cron` 등록 및 동작 확인.

## 5. 최종 체크리스트 (Validation)
- [ ] 지정된 시간에 Edge Function이 호출되는가?
- [ ] 전용 보안 키(`CRON_SECRET_KEY`)가 없을 때 호출이 차단되는가?
- [x] 실행 로그가 DB에 정상적으로 기록되는가? (수동 실행 시 확인 완료)
