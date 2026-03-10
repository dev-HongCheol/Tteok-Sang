# PRD: Nitter 피드 수집 및 증분 동기화 (Nitter Feed Sync)

## 1. 개요
- **목표:** 전문가의 Nitter RSS 피드를 수집하여 `ts_feeds` 테이블에 저장하고, 중복 수집을 방지하는 증분 동기화 로직을 구현한다.
- **주요 작업:** RSS 피드 파싱, 증분 수집 로직(재귀적 패칭), 데이터 저장(UPSERT), 전문가 동기화 시점 업데이트.

## 2. 사용자 스토리 (시스템 관점)
- "시스템은 전문가의 RSS URL을 호출하여 최신 트윗을 가져올 수 있어야 한다."
- "시스템은 이미 저장된 최신 트윗보다 더 과거의 데이터를 만나면 수집을 중단해야 한다."
- "시스템은 수집된 트윗 중 가장 최신 시점을 전문가의 `last_synced_at`에 기록해야 한다."

## 3. 기술적 상세 및 요구사항

### 3.1 외부 라이브러리
- **RSS Parser:** `rss-parser` (XML 데이터를 JSON으로 변환)
- **HTTP Client:** Axios (이미 설치됨)

### 3.2 수집 로직 (Incremental Fetching)
1.  **준비:** 전문가의 `twitter_handle`과 `last_synced_at` 정보를 DB에서 가져온다.
2.  **호출:** Nitter RSS URL(`https://nitter.net/[handle]/rss`)을 호출한다.
3.  **파싱 및 필터링:**
    - 가져온 피드 아이템들을 최신순으로 정렬한다.
    - 각 아이템의 작성 시간(`pubDate`)을 DB의 `last_synced_at`과 비교한다.
    - **중단 조건:** 아이템의 시간이 `last_synced_at`보다 과거이거나 같으면 해당 아이템부터는 수집을 중단한다.
4.  **저장:** 새로운 피드들만 추출하여 `ts_feeds` 테이블에 `tweet_id` 기준 `UPSERT` 한다.
5.  **갱신:** 수집된 피드 중 가장 최신 시점으로 전문가의 `last_synced_at`을 업데이트한다.

### 3.3 재귀적 패칭 전략 (확장성 고려)
- Nitter RSS가 페이지네이션을 지원하는 경우(예: `?cursor=...`), 현재 페이지의 마지막 아이템이 여전히 `last_synced_at`보다 미래라면 다음 페이지를 재귀적으로 호출한다. (최초 수집 시 10개 이상 확보용)

## 4. 단계별 구현 로드맵

### 1단계: 환경 구축 및 유틸리티 작성
- [x] `rss-parser` 라이브러리 설치.
- [x] `src/shared/lib/rss/parser.ts` 작성 (RSS -> JSON 변환 유틸).

### 2단계: 피드 수집 기능 구현 (Feature)
- [x] `src/features/sync-feed/model/sync-logic.ts` 작성.
- [x] 전문가별 `last_synced_at` 조회 및 비교 로직 구현.
- [x] `ts_feeds` 테이블에 데이터를 저장하는 Supabase 연동 코드 작성.

### 3단계: 테스트 코드 작성
- [x] Mock RSS 데이터를 활용한 수집 중단 조건 테스트 (Vitest).
- [x] 실제 Nitter 인스턴스 호출 테스트 (선택 사항).

## 5. 최종 체크리스트 (Validation)
- [x] 최초 수집 시 지정된 개수(10개) 이상의 데이터를 가져오는가?
- [x] 이미 수집된 데이터 지점에 도달했을 때 불필요한 패칭을 멈추는가?
- [x] 수집 완료 후 전문가의 `last_synced_at`이 정상적으로 최신화되는가?
- [x] 중복된 `tweet_id` 삽입 시 DB 에러 없이 무시(또는 업데이트)되는가?
