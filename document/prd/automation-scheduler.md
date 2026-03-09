# PRD: 자동 스케줄러 및 파이프라인 자동화 (Automation Scheduler)

## 1. 개요
- **목표:** 수동 실행 없이 시스템이 1시간마다 자동으로 전문가 피드를 수집하고 Gemini AI로 분석하도록 자동화 파이프라인을 구축한다.
- **주요 작업:** Supabase Edge Function 구현, 파이프라인 트리거 엔드포인트 보안 설정, Supabase `pg_cron` 스케줄링 설정.

## 2. 사용자 스토리 (시스템 관점)
- "시스템은 1시간마다 자동으로 모든 전문가의 새로운 피드를 확인해야 한다."
- "시스템은 외부의 무단 호출로부터 파이프라인 실행 엔드포인트를 보호해야 한다."
- "개발자는 파이프라인 실행 로그를 통해 자동화 작업의 성공/실패 여부를 확인할 수 있어야 한다."

## 3. 기술적 상세 및 요구사항

### 3.1 보안 정책 (Dedicated Secret Key)
- **보안 위험 방지:** Supabase의 `JWT_SECRET`은 시스템 전체 세션을 담당하므로 절대 외부 트리거용으로 사용하지 않는다.
- **전용 키 사용:** 트리거 전용인 `CRON_SECRET_KEY`를 별도로 생성하여 Next.js 서버와 Supabase 컨테이너에 공유한다.

### 3.2 셀프 호스팅 인프라 설정 (Docker Compose)
1.  **docker-compose.yml:** `functions` 서비스의 `environment` 섹션에 `CRON_SECRET_KEY: ${CRON_SECRET_KEY}` 추가.
2.  **.env:** 호스트 서버의 환경 변수 파일에 `CRON_SECRET_KEY` 랜덤 문자열 정의.
3.  **적용:** `docker compose up -d`를 통해 설정을 반영한다.

### 3.3 자동화 파이프라인 구조
1.  **Edge Function (`sync-pipeline`):**
    - 파이프라인 실행을 트리거하는 HTTP 엔드포인트.
    - 내부적으로 배포된 Next.js API(`/api/cron/sync`)를 호출.
2.  **Cron Job:**
    - Supabase 내장 `pg_cron`을 사용하여 정해진 주기에 Edge Function 호출.

## 4. 단계별 구현 로드맵

### 1단계: Edge Function 개발
- [x] Supabase CLI를 사용하여 `sync-pipeline` 함수 초기화.
- [x] 파이프라인 실행 로직(Deno용) 작성 및 보안 가이드 주석 추가.

### 2단계: Next.js 트리거 API 구축
- [x] `src/app/api/cron/sync/route.ts` 구현.
- [x] `env.ts` 스키마에 `CRON_SECRET_KEY` 추가 및 검증.

### 3단계: 인프라 설정 및 테스트
- [ ] Docker Compose 환경 변수 설정 및 컨테이너 재시작.
- [ ] Supabase SQL Editor를 통해 `pg_cron` 등록 및 동작 확인.

## 5. 최종 체크리스트 (Validation)
- [ ] 지정된 시간에 Edge Function이 호출되는가?
- [ ] 전용 보안 키(`CRON_SECRET_KEY`)가 없을 때 호출이 차단되는가?
- [ ] 실행 로그가 DB에 정상적으로 기록되는가?
