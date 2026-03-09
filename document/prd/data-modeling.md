# PRD: 데이터 모델링 및 Supabase 스키마 설계 (Data Modeling)

## 1. 개요
- **목표:** 전문가 정보, 수집된 피드, AI 분석 결과(인사이트)를 저장하기 위한 데이터베이스 스키마를 설계하고 Supabase에 반영한다.
- **주요 작업:** 테이블 프리픽스(`ts_`) 적용, 전문가(Experts), 피드(Feeds), 인사이트(Insights) 테이블 설계 및 SQL 관리 체계 수립.

## 2. 사용자 스토리 (시스템 관점)
- "시스템은 전문가별로 마지막으로 수집된 시간을 기억하여 증분 수집을 수행해야 한다."
- "시스템은 셀프 호스팅 Supabase 환경에서 서비스 구분을 위해 `ts_` 프리픽스를 사용해야 한다."
- "관리자는 파이프라인 실행 주기를 웹에서 설정하고, 실행 로그를 통해 성공 여부를 확인할 수 있어야 한다."

## 3. 데이터베이스 관리 정책 (SQL 3-Set Rule)

모든 데이터베이스 변경 사항은 `infra/supabase/` 경로에 다음 3가지 유형의 파일 쌍으로 관리합니다.

### 3.1 SQL 파일 구성
1.  **`schema.sql` (최초 설정용):** 새로운 인프라에 전체 테이블, 인덱스, 제약 조건을 생성할 때 사용합니다. (`IF NOT EXISTS` 포함)
2.  **`migration_[YYYYMMDD_HHMM].sql` (마이그레이션용):** 기존 테이블에 컬럼을 추가하거나 타입을 변경하는 등 스키마 변경 시 사용합니다.
3.  **`reset_data.sql` (데이터 초기화용):** 테이블 구조는 유지하되, 모든 데이터를 안전하게 삭제(TRUNCATE)하고 초기 시드 데이터를 주입할 때 사용합니다.

### 3.2 테이블 명세
- **ts_experts:** 전문가 프로필 및 동기화 시점 관리
- **ts_feeds:** Nitter 수집 원본 트윗 데이터
- **ts_insights:** Gemini AI 분석 결과 및 요약
- **ts_settings:** 시스템 설정 (실행 주기 등)
- **ts_pipeline_logs:** 파이프라인 실행 결과 로그

### 3.3 ts_settings (시스템 설정)
| 컬럼명 | 타입 | 설명 |
| :--- | :--- | :--- |
| key | text | 기본키, 설정 식별자 (예: 'sync_interval') |
| value | text | 설정 값 |
| updated_at | timestamptz | 수정일 |

### 3.4 ts_pipeline_logs (실행 로그)
| 컬럼명 | 타입 | 설명 |
| :--- | :--- | :--- |
| id | uuid | 기본키 |
| started_at | timestamptz | 시작 일시 |
| ended_at | timestamptz | 종료 일시 |
| status | text | 결과 상태 ('success', 'error') |
| collected_count | int | 수집된 신규 피드 수 |
| analyzed_count | int | 분석 완료된 인사이트 수 |
| error_message | text | 에러 발생 시 상세 내용 |

## 4. 단계별 구현 로드맵

### 1단계: Supabase 테이블 생성
- [x] `infra/supabase/schema.sql` 작성 완료.
- [x] `infra/supabase/reset_data.sql` 작성 완료.
- [ ] `infra/supabase/migration_20260309_1640.sql` (설정 및 로그 테이블 추가) 작성.

### 2단계: TypeScript Entity 정의
- [x] Expert, Feed, Insight 타입 정의 완료.
- [ ] `src/entities/system/model/types.ts` 작성 (Setting, PipelineLog).

### 3단계: DB 클라이언트 및 로직 통합
- [x] Supabase 클라이언트 초기화 완료.
- [ ] 파이프라인 실행 시 로그 저장 로직 추가.

## 5. 최종 체크리스트 (Validation)
- [x] 모든 테이블 이름에 `ts_` 프리픽스가 적용되었는가?
- [x] SQL 3-Set Rule에 따라 마이그레이션 파일이 생성되었는가?
- [ ] 설정 변경 시 실제 파이프라인 실행 주기가 연동되는가?
