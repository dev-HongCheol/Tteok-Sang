# 🚀 Tteok-Sang (떡상) - AI 경제 피드 큐레이터

특정 분야 전문가의 인사이트를 수집하고, Gemini AI를 통해 핵심 경제 지표를 추출하여 큐레이션하는 서비스입니다.

## 🛠️ 기술 스택

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Package Manager:** `pnpm`
- **UI:** shadcn/ui, Tailwind CSS
- **State Management:** Axios, TanStack Query (v5)
- **Validation:** React Hook Form, Zod
- **Database/Auth:** Self-hosted Supabase
- **AI Model:** Gemini 2.5 Flash
- **Testing:** Vitest, Playwright

## 📁 아키텍처 (Feature-Sliced Design)

프로젝트는 **FSD** 아키텍처를 따릅니다. 모든 코드는 `src/` 폴더 내에 위치합니다.

- `app/`: Next.js App Router 설정 및 전역 스타일
- `pages/`: 페이지 구성 요소
- `widgets/`: 독립적인 UI 블록 (FeedCard, Navigation 등)
- `features/`: 사용자 상호작용 및 비즈니스 로직
- `entities/`: 비즈니스 엔티티 (Feed, User, Insight)
- `shared/`: 공통 컴포넌트, 유틸리티, API 클라이언트

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
# 단위 테스트 (Vitest)
pnpm test

# E2E 테스트 (Playwright)
npx playwright test
```

## 🤖 개발 프로세스
이 프로젝트는 **PRD(Product Requirements Document)** 기반의 설계를 우선합니다.
모든 새로운 기능은 `document/prd/` 경로에 명세서 작성 후 구현됩니다.
