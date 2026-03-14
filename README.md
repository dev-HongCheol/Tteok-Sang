# 🚀 Tteok-Sang (떡상) - AI 경제 피드 큐레이터

**떡상(Tteok-Sang)**은 흩어져 있는 경제/주식 전문가들의 통찰력을 한곳에 모아, Gemini AI가 실시간으로 분석하고 정량화된 투자 지표(Sentiment Radar)를 제공하는 인텔리전스 큐레이션 서비스입니다.

---

## 🌟 핵심 비전
> "전문가들의 정성적인 글을 정량적인 데이터로 변환하여 시장의 온도를 1초 만에 파악합니다."

## ✨ 주요 기능

### 1. 전문가 피드 실시간 수집 (Expert Sync)
- **Nitter RSS 연동:** X(Twitter) API 없이도 전문가 계정의 피드를 실시간으로 증분 수집합니다.
- **다중 인스턴스 폴백:** 수집 안정성을 위해 여러 Nitter 인스턴스를 관리하고 장애 시 자동으로 전환합니다.

### 2. 고도화된 AI 인사이트 추출 (AI Analysis)
- **Gemini 3.1 Flash Lite 기반:** 각 피드를 분석하여 관련성 점수, 중요도, 시장 분류(KR/US/Global), 언급된 종목, 투자 방향성(Bullish/Bearish)을 추출합니다.
- **구조화된 데이터:** AI가 뽑아낸 데이터를 Zod 스키마로 검증하여 데이터 무결성을 보장합니다.

### 3. 지능형 종목 정규화 시스템 (Stock Normalization)
- **Verified Master Data:** 시스템이 공식 티커와 한글명 매핑 정보를 관리하여 AI의 티커 오타나 환각(Hallucination)을 원천 차단합니다.
- **런타임 정규화:** 마스터 데이터를 수정하면 과거에 저장된 모든 분석 데이터가 실시간으로 최신 정보로 맵핑되어 차트에 반영됩니다.
- **자동 병합 및 누적:** 별칭(Aliases) 기능을 통해 동일 기업에 대한 다양한 언급(예: 구글, 구으글, Google)을 하나로 통합하고 언급 횟수를 정확히 합산합니다.

### 4. 통합 어드민 관리 대시보드 (Admin System)
- **사이드바 내비게이션:** 전문가 관리, 종목 마스터 관리, 시스템 로그 확인을 위한 직관적인 관리자 인터페이스를 제공합니다.
- **미검증 종목 승인:** AI가 새로 발견한 종목을 관리자가 검토 후 공식 종목으로 승인하거나 기존 종목과 병합할 수 있습니다.
- **카운트 동기화:** 실제 인사이트 데이터를 전수 조사하여 종목별 언급 횟수를 실시간으로 재계산하고 동기화합니다.

### 5. 실시간 투자 레이더 대시보드 (Dashboard)
- **Sentiment Market Map:** 시장의 섹터별 온도를 Finviz 스타일의 트리맵으로 시각화하여 유망 종목을 한눈에 포착합니다.
- **정교한 필터링:** 시장별, 섹터별, 전문가별로 본인이 원하는 투자 정보만 골라볼 수 있습니다.

---

## 🛠️ 기술 스택

- **Framework:** Next.js 15 (App Router)
- **UI/UX:** Tailwind CSS 4, shadcn/ui, Lucide Icons
- **Backend as a Service:** Supabase (Auth, Database, Edge Functions, RPC)
- **AI Intelligence:** Google Gemini API (gemini-3.1-flash-lite-preview)
- **Architecture:** Feature-Sliced Design (FSD)
- **State Management:** TanStack Query v5

## 📁 아키텍처 (Feature-Sliced Design)

프로젝트는 유지보수성과 확장성을 위해 **FSD** 계층 구조를 엄격히 따릅니다.

- `app/`: 라우팅 및 전역 레이아웃 (Admin/Main 분리)
- `views/`: 페이지 단위 구성 요소 (Dashboard, Stocks, Experts)
- `widgets/`: 독립적인 UI 블록 (SentimentMarketMap, InsightCard)
- `features/`: 비즈니스 로직 (AnalyzeFeed, ManageStocks, SyncPipeline)
- `entities/`: 데이터 모델 및 API (Stock, Insight, Feed, Expert)
- `shared/`: 공통 컴포넌트, 훅(useMobile), API 클라이언트

---

## 🚀 시작하기

### 환경 변수 설정
`.env.local` 파일을 생성하고 다음 정보를 입력합니다.
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

### 개발 서버 실행
```bash
pnpm install
pnpm dev
```

---

## 🤖 개발 문화
이 프로젝트는 **PRD(Product Requirements Document)** 기반의 설계를 원칙으로 합니다. 모든 기능은 `document/prd/`에 상세 명세와 체크리스트를 작성한 후 구현되며, 데이터베이스 변경 사항은 마이그레이션 파일로 엄격히 관리됩니다.
