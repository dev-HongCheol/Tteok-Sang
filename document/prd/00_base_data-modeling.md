# PRD: 데이터 모델링 및 Supabase 스키마 설계 (Data Modeling)

## 1. 개요
- **목표:** 서비스 운영에 필요한 핵심 데이터 구조를 설계하고 Supabase(PostgreSQL)에 구현한다.
- **원칙:** 이 문서는 모든 테이블 스키마의 '진실의 원천(Source of Truth)'이며, 모든 기능 문서는 이 스펙을 따른다.

## 2. 테이블 상세 설계

### 2.1 ts_experts (전문가 계정)
| 컬럼명 | 타입 | 제약조건 | 설명 |
| :--- | :--- | :--- | :--- |
| id | uuid | PK, default: uuid_generate_v4() | 고유 ID |
| name | text | not null | 전문가 이름 |
| twitter_handle | text | not null, unique | 트위터 아이디 |
| is_active | boolean | default: true | 수집 활성화 상태 |
| last_synced_at | timestamptz | | 마지막 수집 시점 |
| created_at | timestamptz | default: now() | 생성 일시 |

### 2.2 ts_feeds (수집된 피드)
| 컬럼명 | 타입 | 제약조건 | 설명 |
| :--- | :--- | :--- | :--- |
| id | uuid | PK, default: uuid_generate_v4() | 고유 ID |
| expert_id | uuid | FK (ts_experts.id), not null | 작성 전문가 ID |
| tweet_id | text | not null, unique | 원본 트윗 고유 ID |
| content | text | not null | 트윗 본문 |
| published_at | timestamptz | not null | 트윗 작성 시점 |
| raw_data | jsonb | | RSS 원본 데이터 전체 |
| created_at | timestamptz | default: now() | 수집 일시 |

### 2.3 ts_insights (AI 분석 결과)
| 컬럼명 | 타입 | 제약조건 | 설명 |
| :--- | :--- | :--- | :--- |
| id | uuid | PK, default: uuid_generate_v4() | 고유 ID |
| feed_id | uuid | FK (ts_feeds.id), not null, unique | 대상 피드 ID |
| relevance_score | int | check (0-100) | 경제/주식 관련성 점수 |
| summary_line | text | | 핵심 논리 1줄 요약 |
| importance | text | check (Low, Medium, High) | 중요도 레벨 |
| market_type | text | check (KR, US, Global) | 대상 시장 분류 |
| mentioned_stocks | jsonb | | 언급된 종목 리스트 (`[{ticker, name_ko}]`) |
| is_explicit | boolean | | 종목명 직접 명시 여부 |
| sectors | text[] | | 관련 섹터 태그 리스트 |
| sentiment_direction | text | check (Bullish, Bearish, Neutral) | 투자 방향성 |
| sentiment_intensity | int | check (1-5) | 관점의 강도 |
| investment_horizon | text | check (intraday, swing, long-term) | 투자 시계/호흡 |
| confidence_level | text | check (low, medium, high) | AI 확신도 |
| logic_type | text[] | | 판단 근거 유형 리스트 |
| created_at | timestamptz | default: now() | 생성 일시 |

### 2.4 ts_pipeline_logs (시스템 실행 로그)
| 컬럼명 | 타입 | 제약조건 | 설명 |
| :--- | :--- | :--- | :--- |
| id | uuid | PK, default: uuid_generate_v4() | 고유 ID |
| type | text | not null | 로그 유형 (`sync`, `analysis`, `full`) |
| status | text | not null | 상태 (`success`, `failed`, `running`) |
| message | text | | 실행 결과 상세 메시지 |
| metadata | jsonb | | 처리 건수 등 상세 데이터 |
| error_log | text | | 에러 발생 시 스택 트레이스 |
| created_at | timestamptz | default: now() | 생성 일시 |

## 3. 단계별 구현 로드맵
(기존 로드맵 유지)
