# PRD: 데이터 모델링 및 Supabase 스키마 설계 (Data Modeling)

## 1. 개요
- **목표:** 전문가 정보, 수집된 피드, AI 분석 결과(인사이트)를 저장하기 위한 데이터베이스 스키마를 설계하고 Supabase에 반영한다.
- **주요 작업:** 테이블 프리픽스(`ts_`) 적용, 전문가(Experts), 피드(Feeds), 인사이트(Insights) 테이블 설계 및 SQL 관리 체계 수립.

## 2. 사용자 스토리 (시스템 관점)
- "시스템은 전문가별로 마지막으로 수집된 시간을 기억하여 증분 수집을 수행해야 한다."
- "시스템은 셀프 호스팅 Supabase 환경에서 서비스 구분을 위해 `ts_` 프리픽스를 사용해야 한다."
- "개발자는 인프라 복구, 변경 사항 반영, 데이터 초기화를 위해 표준화된 SQL 세트를 유지해야 한다."

## 3. 데이터베이스 관리 정책 (SQL 3-Set Rule)

모든 데이터베이스 변경 사항은 `infra/supabase/` 경로에 다음 3가지 유형의 파일 쌍으로 관리합니다.

### 3.1 SQL 파일 구성
1.  **`schema.sql` (최초 설정용):** 새로운 인프라에 전체 테이블, 인덱스, 제약 조건을 생성할 때 사용합니다. (`IF NOT EXISTS` 포함)
2.  **`migration_[YYYYMMDD_HHMM].sql` (마이그레이션용):** 기존 테이블에 컬럼을 추가하거나 타입을 변경하는 등 스키마 변경 시 사용합니다.
3.  **`reset_data.sql` (데이터 초기화용):** 테이블 구조는 유지하되, 모든 데이터를 안전하게 삭제(TRUNCATE)하고 초기 시드 데이터를 주입할 때 사용합니다.

### 3.2 테이블 상세 명세
- **ts_experts:** 전문가 프로필 및 동기화 시점 관리
- **ts_feeds:** Nitter 수집 원본 트윗 데이터
- **ts_insights:** Gemini AI 분석 결과 및 요약

## 4. 단계별 구현 로드맵

### 1단계: Supabase 테이블 생성
- [x] `infra/supabase/schema.sql` (최초 설정용) 생성 및 주석 추가.
- [x] `infra/supabase/reset_data.sql` (데이터 초기화용) 생성.
- [x] Supabase SQL Editor에서 `schema.sql` 실행하여 테이블 생성 완료.

### 2단계: TypeScript Entity 정의
- [x] `src/entities/expert/model/types.ts` 작성 완료.
- [x] `src/entities/feed/model/types.ts` 작성 완료.
- [x] `src/entities/insight/model/types.ts` 작성 완료.

### 3단계: DB 클라이언트 유틸리티 작성
- [x] Supabase 클라이언트 라이브러리 설치 (`@supabase/supabase-js`).
- [x] `src/shared/api/supabase/client.ts` 초기화 완료.

## 5. 최종 체크리스트 (Validation)
- [x] 모든 테이블 이름에 `ts_` 프리픽스가 적용되었는가?
- [x] `schema.sql`에 테이블/컬럼 주석이 포함되어 Supabase UI에 노출되는가?
- [x] 데이터 초기화 스크립트(`reset_data.sql`)가 외래키 관계를 고려하여 작성되었는가?
- [x] TypeScript 엔티티 타입이 Supabase 테이블 구조와 일치하는가?
