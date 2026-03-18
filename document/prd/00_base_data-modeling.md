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
| mentioned_stocks | jsonb | | 언급된 종목 리스트 (`[{ticker, name_ko, is_verified}]`. ts_stocks 기반 정규화 결과 저장) |
| is_explicit | boolean | | 종목명 직접 명시 여부 |
| sectors | text[] | | 관련 섹터 태그 리스트 (첫 번째 요소가 대표 섹터로 간주됨) |
| sentiment_direction | text | check (Bullish, Bearish, Neutral) | 투자 방향성 (상승/하락/중립) |
| sentiment_intensity | int | check (1-5) | 관점의 강도 (1:매우약함 ~ 5:매우강함) |
| investment_horizon | text | check (intraday, swing, long-term) | 투자 시계/호흡 |
| confidence_level | text | check (low, medium, high) | AI 확신도 |
| logic_type | text[] | | 판단 근거 유형 리스트 |
| created_at | timestamptz | default: now() | 생성 일시 |

### 2.4 ts_stocks (종목 마스터 데이터)
| 컬럼명 | 타입 | 제약조건 | 설명 |
| :--- | :--- | :--- | :--- |
| ticker | text | PK | 종목 공식 티커 (식별자) |
| name_ko | text | not null | 공식 한글 종목명 |
| market_type | text | check (KR, US, Global) | 상장 시장 분류 |
| aliases | text[] | default: '{}' | 오타, 영문명 등 검색/매칭용 별칭 리스트 |
| is_verified | boolean | default: false | 관리자 검증 완료 여부 |
| mention_count | int | default: 0 | 누적 언급 횟수 (우선순위 관리용) |
| created_at | timestamptz | default: now() | 등록 일시 |

### 2.5 ts_pipeline_logs (시스템 실행 로그)
| 컬럼명 | 타입 | 제약조건 | 설명 |
| :--- | :--- | :--- | :--- |
| id | uuid | PK, default: uuid_generate_v4() | 고유 ID |
| started_at | timestamptz | default: now() | 실행 시작 시점 |
| status | text | | 상태 (`success`, `failed`, `진행중`, `완료` 등) |
| collected_count | int | default: 0 | 수집된 피드 수 |
| analyzed_count | int | default: 0 | 분석 완료된 인사이트 수 |
| error_message | text | | 에러 발생 시 상세 메시지 또는 진행 상태 텍스트 |
| created_at | timestamptz | default: now() | 로그 생성 일시 |

### 2.6 ts_settings (시스템 설정)
| 컬럼명 | 타입 | 제약조건 | 설명 |
| :--- | :--- | :--- | :--- |
| key | text | PRIMARY KEY | 설정 키 (예: 'sync_interval') |
| value | text | not null | 설정 값 (Cron 표현식 등) |
| updated_at | timestamptz | default: now() | 최종 수정 시각 |

## 3. Functions & RPCs (서버측 로직)

### 3.1 get_stock_sentiment_ranking (종목별 센티먼트 집계)
- **목적:** 특정 기간 동안의 종목별 센티먼트 점수 합계 및 언급 횟수를 산출하여 랭킹/맵 제공.
- **핵심 로직 (런타임 정규화):** `ts_insights`의 데이터를 `ts_stocks` 마스터 테이블과 실시간 조인하여 최신 티커/이름으로 반환.

### 3.2 sync_stock_normalization (데이터 소급 동기화)
- **목적:** 종목 마스터 정보 변경(티커 수정, 별칭 추가 등) 시 기존 인사이트 데이터를 최신 정보로 일괄 업데이트 및 중복 병합.
- **동작:** 동일 이름을 가진 미검증 종목들의 언급 횟수를 합산하고 과거 인사이트 JSON 데이터를 일괄 교체.

### 3.3 refresh_all_stock_counts (언급 횟수 전수 재계산)
- **목적:** 전체 인사이트 데이터를 전수 조사하여 모든 종목의 누적 언급 횟수를 최신화.

### 3.4 increment_stock_mention (실시간 언급 횟수 증가)
- **목적:** AI 분석 시 특정 종목이 발견되면 마스터 데이터의 언급 횟수를 즉시 1 증가시킴.

## 4. 단계별 구현 로드맵

### Phase 1: 기반 인프라 및 수집 자동화 (완료)
- [x] Supabase 기본 스키마 설계 및 테이블 생성.
- [x] Nitter RSS 기반 전문가 피드 증분 수집 로직 구현.

### Phase 2: AI 분석 및 종목 마스터 고도화 (완료)
- [x] Gemini 3.1 Flash Lite 기반 배치 분석 파이프라인 구현.
- [x] `ts_stocks` 마스터 데이터 도입 및 런타임 정규화 RPC 개발.
- [x] 어드민 통합 관리 시스템 (전문가/종목 마스터/시스템 로그) 구축.
- [x] 별칭(Alias) 기반 지능형 데이터 병합 및 언급 횟수 누적 로직 완성.

### Phase 3: 투자 인사이트 시각화 및 서비스 최적화 (진행 중)
- [x] Finviz 스타일의 Sentiment Market Map (트리맵) 구현.
- [x] 수동 파이프라인 제어 및 실시간 상태 시각화 다이얼로그 구현.
- [x] 어드민 웹 UI 기반 자동 수집 주기 설정 기능 추가.
- [ ] 전문가별/섹터별 투자 적중률 통계 대시보드 추가.
- [ ] 사용자 구독 기반 호재/악재 실시간 알림 시스템.
