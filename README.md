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
- **Gemini 2.5 Flash 기반:** 각 피드를 분석하여 관련성 점수, 중요도, 시장 분류(KR/US/Global), 언급된 종목, 투자 방향성(Bullish/Bearish)을 추출합니다.
- **구조화된 데이터:** AI가 뽑아낸 데이터를 Zod 스키마로 검증하여 데이터 무결성을 보장합니다.

### 3. 실시간 투자 레이더 대시보드 (Dashboard)
- **3계층 정보 헤더:** 관련성, 중요도, 센티먼트 강도를 대시보드 형태로 시각화하여 정보의 위계를 명확히 전달합니다.
- **정교한 필터링:** 시장별, 섹터별, 전문가별로 본인이 원하는 투자 정보만 골라볼 수 있습니다.

### 4. 무인 자동화 파이프라인 (Automation)
- **Supabase Edge Functions & pg_cron:** 별도의 백엔드 서버 없이 클라우드 상에서 매시간 자동으로 수집과 분석이 수행됩니다.
- **실행 로깅 시스템:** 파이프라인의 모든 단계(수집 수, 분석 수, 오류 내역)를 기록하여 시스템 상태를 관리합니다.

---

## 🛠️ 기술 스택

- **Framework:** Next.js 15 (App Router)
- **UI/UX:** Tailwind CSS, shadcn/ui, Lucide Icons
- **Backend as a Service:** Supabase (Auth, Database, Edge Functions)
- **AI Intelligence:** Google Gemini API
- **Architecture:** Feature-Sliced Design (FSD)
- **Testing & Quality:** Vitest (Unit), Playwright (E2E)

## 📁 아키텍처 (Feature-Sliced Design)

프로젝트는 유지보수성과 확장성을 위해 **FSD** 계층 구조를 엄격히 따릅니다.

- `app/`: 라우팅 및 전역 설정
- `views/`: 페이지 단위 구성 요소
- `widgets/`: 독립적인 UI 블록 (InsightCard 등)
- `features/`: 사용자 인터랙션 및 비즈니스 로직 (SyncPipeline, FeedFilter 등)
- `entities/`: 비즈니스 데이터 모델 및 타입 (Feed, Expert, Insight 등)
- `shared/`: 공통 컴포넌트, API 클라이언트, 유틸리티

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

### 테스트 실행
```bash
# 단위 및 로직 테스트 실행
pnpm test

# E2E 테스트 실행
npx playwright test
```

---

## 🤖 개발 문화
이 프로젝트는 **PRD(Product Requirements Document)** 기반의 설계를 원칙으로 합니다. 모든 기능은 `document/prd/`에 상세 명세와 체크리스트를 작성한 후 구현되며, `gemini.md` 가이드를 통해 일관된 스타일과 아키텍처를 유지합니다.
