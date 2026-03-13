# PRD: 센티먼트 점수 산출 및 종목별 집계 (Sentiment Scoring & Aggregation)

## 1. 개요
- **목표:** AI 분석 결과(`ts_insights`)를 수치화하여 종목별 센티먼트 점수를 계산하고, 실시간 랭킹 데이터를 생성한다.
- **의존성:** `01_logic_analysis-strategy.md` (MVP 전략)

## 2. 구현 상세 (Technical Specification)

### 2.1 서버측 점수 계산 함수 (Server Logic)
- **위치:** `src/entities/insight/api/insight.ts` 또는 유틸리티 함수.
- **로직:**
  ```typescript
  const calculateScore = (direction: string, intensity: number) => {
    const weight = direction === 'Bullish' ? 1 : direction === 'Bearish' ? -1 : 0;
    return weight * intensity; // 범위: -5 ~ +5
  }
  ```

### 2.2 종목별 데이터 집계 (Data Aggregation)
- **대상:** 특정 기간 이내에 발행된 피드와 연결된 `ts_insights` (기존 `created_at`에서 `ts_feeds.published_at` 기준으로 개선).
- **방법:** `mentioned_stocks` JSONB 배열을 Unnest 하여 종목별로 그룹화.
- **하이브리드 그룹화 전략:**
  - 티커가 존재하고 `'N/A'`가 아니면 **티커**를 기준으로 그룹화.
  - 티커가 없거나 `'N/A'`이면 **한글 종목명(`name_ko`)**을 기준으로 그룹화.
  - 이를 통해 비상장사와 상장사가 뒤섞이는 현상을 방지하고 데이터 정확도를 높임.
- **산출 필드:**
  - `ticker`: 종목 식별자 (대표값)
  - `name_ko`: 한글 종목명 (가장 최근 데이터 기준)
  - `total_score`: 해당 종목의 모든 인사이트 점수 합계
  - `mention_count`: 언급 횟수
  - `avg_intensity`: 평균 강도

### 2.3 Supabase RPC 구현 (get_stock_sentiment_ranking_v2)
데이터 무결성과 중복 제거를 위해 고도화된 RPC 함수를 사용한다.

```sql
-- 하이브리드 그룹화 및 발행일 기준 집계 로직 적용됨
-- 자세한 내용은 infra/supabase/migration_20260312_0001_sentiment_v2.sql 참조
```

### 2.4 UI 컴포넌트 구조 (Widget Layer)
`src/widgets/sentiment-radar/` 하위에 위치하며, FSD 패턴에 따라 독립적인 UI 블록으로 구성된다.

- **`SentimentRadar`**: 센티먼트 위젯의 최상위 컨테이너. 데이터 Fetching 및 상승/하락 TOP 5 리스트를 렌더링한다.
- **`SentimentItemCard`**: 종목명, 티커, 총합 점수, 언급 횟수, 평균 강도를 요약하여 보여주는 카드.
- **`SentimentDetailDialog`**: 특정 종목 클릭 시 노출되는 상세 모달. 해당 종목이 언급된 원본 피드 본문과 AI 요약을 타임라인 형태로 제공한다.
- **`SentimentMarketMap`**: 전체 시장의 섹터별/종목별 센티먼트 분포를 시각화하는 트리맵 구조 컴포넌트.
- **`Date/Year/MonthPicker`**: 사용자가 집계 기간을 자유롭게 설정할 수 있도록 돕는 필터 도구.

## 3. 작업 체크리스트 (MVP Task List)
- [x] 개별 인사이트 점수 계산 유틸리티 구현.
- [x] 종목별 센티먼트 집계 RPC 구현 (하이브리드 그룹화 및 발행일 필터 적용).
- [x] 상세 분석 모달 컴포넌트(`SentimentDetailDialog`) 분리 및 리팩토링.
- [x] UI 한글화 및 호버/액티브 인터랙션 추가.
- [x] 메인 화면 전역 필터와 레이더 위젯 연동.
- [x] 상승/하락 TOP 5 섹션 분리 및 전체 시장 트리맵(`SentimentMarketMap`) 구조 설계.

## 4. 최종 검증 (Validation)
- [x] 동일 종목에 대해 Bullish(+3)와 Bearish(-2)가 있을 때 합산 점수가 +1이 되는가?
- [x] 발행일(`published_at`) 기준으로 정확하게 기간 필터링이 되는가?
- [x] 티커가 'N/A'인 비상장사들이 이름 기준으로 정확히 그룹화되고 상세 정보가 일치하는가?
- [x] 메인 페이지의 날짜 필터 변경 시 레이더 데이터가 동기화되는가?
- [x] 모달에서 해당 종목이 언급된 실제 트윗 내용이 정확히 출력되는가?
