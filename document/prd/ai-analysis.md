# PRD: Gemini AI 분석 및 전수 수집 (AI Analysis & Full Collection)

## 1. 개요
- **목표:** 수집된 원본 피드(`ts_feeds`)를 Gemini AI로 배치 분석하여 '경제/주식 관련성'을 평가하고, 모든 결과를 효율적으로 저장한다.
- **주요 작업:** Gemini 2.5 Flash API 연동, **최대 10개 단위 배치 분석**, Zod 기반 JSON 배열 파싱, `ts_insights` 전수 저장.

## 2. 사용자 스토리 (시스템 관점)
- "시스템은 API 호출 제한(RPM)을 준수하기 위해 여러 개의 트윗을 한 번에 묶어서 분석을 요청해야 한다."
- "시스템은 분석 결과가 70점 미만이더라도 '기타' 카테고리로 저장하여 데이터 유실을 방지해야 한다."
- "시스템은 AI 응답이 끊기거나 형식이 어긋날 경우를 대비하여 견고한 파싱 로직을 갖춰야 한다."

## 3. 기술적 상세 및 요구사항

### 3.1 분석 워크플로우 (Batch Pipeline)
1.  **데이터 준비:** 아직 분석되지 않은 `ts_feeds` 아이템을 **최대 10개** 가져온다.
2.  **배치 프롬프트 구성:**
    - 트윗 ID와 내용을 번호가 매겨진 리스트 형태로 전달.
    - AI에게 각 번호에 대응하는 분석 결과를 **JSON 배열(`[]`)** 형태로 응답하도록 강제.
3.  **저장:** 수신된 배열의 각 항목을 `feed_id`와 매칭하여 `ts_insights` 테이블에 한꺼번에 저장.

### 3.2 분류 및 평가 기준 (AI 추출 데이터 구조)
AI는 각 피드를 분석하여 다음의 정형 데이터를 추출한다. (Zod 스키마 강제)

| 필드명 | 타입 | 설명 |
| :--- | :--- | :--- |
| **relevance_score** | number | 0~100점 (투자 가치 및 시장 영향력 기준) |
| **importance** | enum | `High`, `Medium`, `Low` |
| **market_type** | enum | `KR` (국장), `US` (미장), `Global` (글로벌/공통) |
| **mentioned_stocks** | object[] | 언급/추론된 종목 (`{ticker: string, name_ko: string}`) |
| **is_explicit** | boolean | 종목명이 본문에 직접 명시되었는지 여부 |
| **sectors** | string[] | 관련 섹터 (다중 선택: 반도체, AI, 정책/정치, 소비재 등) |
| **sentiment_direction** | enum | `Bullish` (긍정), `Bearish` (부정), `Neutral` (중립) |
| **sentiment_intensity** | 1~5 | 관점의 강도 (1: 약함 ~ 5: 매우 강함) |
| **investment_horizon** | enum | `intraday`, `swing`, `long-term` |
| **confidence_level** | enum | `low`, `medium`, `high` (AI의 판단 확신도) |
| **logic_type** | string[] | `valuation`, `momentum`, `macro`, `earnings`, `rumor` 등 근거 유형 |
| **summary_line** | string | 핵심 논리를 담은 1줄 요약 |

### 3.3 섹터(Sectors) 상세 리스트
- `거시경제`, `정책/정치`, `인공지능`, `반도체`, `2차전지`, `빅테크`, `자동차`, `에너지/원자재`, `로봇`, `바이오`, `증권/금융`, `소비재/유통`, `부동산`, `코인`, `공시/실적`, `방산`, `조선`, `기타(분류외)`, `분석불가(비관련)`

### 3.4 카테고리 상세 가이드
- **기타(분류외):** 투자 관련 정보이나 위 섹터에 해당하지 않는 경우 (예: 항공, 해운, 교육 등).
- **분석불가(비관련):** 투자와 전혀 무관한 일상 대화, 광고, 스팸 등 (관련성 점수 0~10점대).

### 3.3 효율성 전략
- **RPM 최적화:** 10개당 1회 호출로 호출 횟수 90% 절감.
- **토큰 절약:** 공통 시스템 프롬프트를 1회만 전달하여 중복 토큰 제거.
- **데이터 보존:** 관련성이 낮은 피드도 분석 결과(0점 및 '기타')를 저장하여 불필요한 재분석 방지.

## 4. 단계별 구현 로드맵

### 1단계: API 연동 및 환경 구축
- [x] `@google/generative-ai` 설치 완료.
- [x] `src/shared/api/gemini/client.ts` 작성 완료.

### 2단계: 배치 분석 로직 구현 (Feature)
- [x] `src/features/analyze-feed/model/analysis-logic.ts`를 배치 처리 방식(`analyzeFeedsBatch`)으로 전환 완료.
- [x] JSON 배열 응답을 위한 Zod 스키마 확장 완료.

### 3단계: 테스트 코드 작성
- [x] 여러 개의 피드 아이템이 포함된 Mock 응답 테스트(Vitest) 통과.
- [x] 응답 형식 오류 시 예외 처리 로직 검증 완료.

## 5. 최종 체크리스트 (Validation)
- [x] 최대 10개의 트윗이 하나의 API 호출로 처리되는가?
- [x] AI가 반환한 JSON 배열이 각 트윗의 `feed_id`와 정확히 매칭되는가?
- [x] 무료 티어의 RPM 제한 내에서 안정적으로 작동하는가?
