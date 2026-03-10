# PRD: 프로젝트 초기 설정 및 기반 구축 (Initial Setup)

## 1. 개요
- **목표:** Tteok-Sang 프로젝트의 기술 스택을 설치하고, FSD(Feature-Sliced Design) 아키텍처 및 테스트 환경을 구축한다.
- **주요 작업:** Next.js 초기화, pnpm 설정, 핵심 라이브러리 설치, 폴더 구조 생성, 테스트 프레임워크(Vitest, Playwright) 설정.

## 2. 사용자 스토리 (개발자 관점)
- "개발자는 FSD 구조에 따라 코드를 분리하여 유지보수성을 높일 수 있어야 한다."
- "개발자는 기능을 구현할 때마다 Vitest를 통해 로직을 즉시 검증할 수 있어야 한다."
- "개발자는 Zod를 통해 환경 변수와 API 응답의 타입 안정성을 보장받아야 한다."

## 3. 기술적 상세 및 요구사항

### 3.1 기술 스택
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Package Manager:** pnpm
- **Styling:** Tailwind CSS, shadcn/ui
- **Data:** Axios, TanStack Query v5, Zod, React Hook Form
- **Testing:** Vitest, React Testing Library, Playwright

### 3.2 디렉토리 구조 (FSD)
```text
src/
  app/          # Global styles, providers, layouts
  pages/        # Page components (composed from widgets)
  widgets/      # Independent UI blocks
  features/     # User interactions & business logic
  entities/     # Business entities (Feed, User, Insight)
  shared/       # UI kit, API clients, Utils, Config
```

### 3.3 핵심 데이터 설계 (Initial)
- **Environment Variables:** `.env.local`에 Supabase URL, Anon Key, Gemini API Key 정의.
- **Config:** `shared/config/env.ts`에서 Zod로 환경 변수 검증.

## 4. 단계별 구현 로드맵

### 1단계: Next.js 프로젝트 초기화
- [x] `pnpm create next-app . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"` 실행.
- [x] 불필요한 기본 파일(기본 favicon, 초기 CSS 등) 정리.

### 2단계: 핵심 라이브러리 및 shadcn/ui 설치
- [x] `axios`, `@tanstack/react-query`, `zod`, `react-hook-form`, `@hookform/resolvers` 설치.
- [x] `npx shadcn-ui@latest init`으로 UI 라이브러리 초기화.

### 3단계: 테스트 환경 구축
- [x] `vitest`, `@testing-library/react`, `@vitejs/plugin-react` 설치 및 `vitest.config.ts` 작성.
- [x] Playwright 설치 및 기본 설정 (`npx playwright install`).

### 4단계: FSD 폴더 구조 및 Shared 모듈 생성
- [x] 각 계층(`app`, `pages`, `widgets`, `features`, `entities`, `shared`) 폴더 생성.
- [x] `shared/api/axios.ts` 기본 클라이언트 설정.
- [x] `shared/config/env.ts` 환경 변수 검증 로직 작성.

## 5. 최종 체크리스트 (Validation)
- [x] `pnpm dev` 명령어로 개발 서버가 정상 작동하는가?
- [x] `pnpm test` 실행 시 샘플 테스트가 통과하는가?
- [x] 필수 환경 변수가 없을 때 서버가 에러를 발생시키는가?
- [x] FSD 구조에 따라 `src/` 폴더가 구성되었는가?
