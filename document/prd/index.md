# PRD Map & Index

이 문서는 Tteok-Sang 프로젝트의 각 기능과 문서 간의 의존성을 관리합니다. 새로운 기능을 추가하거나 수정할 때 이 지도를 먼저 참조하여 관련 문서를 파악하고 업데이트하세요.

## 📁 문서 분류 체계 (Prefix Rules)
- **`00_base_` (기반):** 프로젝트 초기 설정 및 공통 데이터 모델링. (진실의 원천)
- **`01_logic_` (정책/로직):** 비즈니스 규칙, 알고리즘, 전략. (코딩 전의 약속)
- **`02_feat_` (기능):** 개별 UI 화면, API 엔드포인트, 단위 로직.
- **`03_flow_` (통합):** 여러 기능이 결합된 전체 워크플로우 및 자동화.

---

## 🗺️ 문서 맵 (Document Map)

### 0. 기반 및 설정 (Foundation)
| 파일명 | 설명 | 핵심 키워드 |
| :--- | :--- | :--- |
| `00_base_initial-setup.md` | 프로젝트 기술 스택 및 FSD 구조 | `Next.js`, `FSD`, `Testing` |
| `00_base_data-modeling.md` | **진실의 원천.** DB 스키마 및 타입 | `Table`, `Schema`, `Type` |
| `00_base_deployment-infra.md` | **인프라.** Vercel 배포 및 환경 변수 | `Vercel`, `Deployment`, `ENV` |

### 1. 정책 및 로직 (Logic)
| 파일명 | 설명 | 핵심 키워드 |
| :--- | :--- | :--- |
| `01_logic_analysis-strategy.md` | AI 분석 및 점수 산출 로직 | `Scoring`, `Normalization` |

### 2. 기능 상세 (Features)
| 파일명 | 설명 | 핵심 키워드 |
| :--- | :--- | :--- |
| `02_feat_feed-sync.md` | Nitter RSS 수집 및 증분 동기화 | `RSS`, `Nitter`, `Sync` |
| `02_feat_ai-batch-pipeline.md` | Gemini API 배치 분석 및 Zod 파싱 | `Gemini`, `Batch`, `Zod` |
| `02_feat_main-feed-ui.md` | 메인 피드 UI 및 통합 필터링 | `UI`, `Filter`, `Dark Mode` |
| `02_feat_expert-admin.md` | 전문가 정보 CRUD 관리 | `Admin`, `Expert` |

### 3. 통합 및 워크플로우 (Flow)
| 파일명 | 설명 | 핵심 키워드 |
| :--- | :--- | :--- |
| `03_flow_pipeline-integration.md` | 수집+분석 통합 파이프라인 | `Workflow`, `Pipeline` |
| `03_flow_cron-scheduler.md` | 자동화 스케줄러 및 Edge Functions | `pg_cron`, `Edge Function` |
