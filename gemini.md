# 🚀 Tteok-Sang (떡상) - AI 경제 피드 큐레이터

이 파일은 프로젝트의 규칙과 가이드라인을 담고 있습니다. 모든 개발 작업은 이 가이드를 최우선으로 준수합니다.

---

## 🛠️ 프로젝트 정보 및 기술 스택

- **Deployment URL:** [https://tteok-sang.vercel.app](https://tteok-sang.vercel.app)
- **Framework:** Next.js (Latest, App Router)
- **Language:** TypeScript
- **Package Manager:** `pnpm`
- **UI:** shadcn/ui, Tailwind CSS
- **State Management/Data Fetching:** Axios, TanStack Query (v5)
- **Form & Validation:** React Hook Form, Zod
- **Database/Auth:** Self-hosted Supabase ([https://supa.devhong.cc](https://supa.devhong.cc))
- **AI Model:** Gemini 3.1 Flash Lite (무료 티어)
- **Architecture:** Feature-Sliced Design (FSD)
- **Testing:** Vitest, React Testing Library, Playwright (E2E)

---

## 📁 아키텍처 규칙 (FSD)

모든 소스코드는 `src/` 폴더 내에 위치하며 다음 계층 구조를 엄격히 따릅니다.

1.  **app/**: Next.js App Router 정의 (라우팅, 레이아웃, 전역 설정)
2.  **views/**: 실제 페이지 구성 요소 (FSD의 pages 레이어, Next.js 충돌 방지를 위해 views로 명명)
3.  **widgets/**: 독립적인 UI 블록 (예: FeedCard, Navigation Bar)
4.  **features/**: 사용자 상호작용 및 비즈니스 로직 (예: AnalyzeFeed, SubscribeToggle)
5.  **entities/**: 비즈니스 엔티티 (예: Feed, User, Insight 데이터 타입 및 기본 스토어)
6.  **shared/**: 공통 컴포넌트 (UI 라이브러리), API 클라이언트, 유틸리티, 상수

---

## 🔄 개발 워크플로우 (PRD 기반)

새로운 기능을 추가하거나 수정할 때는 반드시 다음 단계를 거칩니다.

### 1단계: PRD 식별 및 분석
- **경로:** `document/prd/`
- **절차:** 
  1. `document/prd/index.md`를 먼저 읽고 이번 작업과 관련된 문서를 식별합니다.
  2. 관련 문서의 프리픽스(`00_base_`, `01_logic_`, `02_feat_`, `03_flow_`)에 따른 우선순위를 파악합니다.
  3. **중요:** DB 스키마 변경 시에는 반드시 `00_base_data-modeling.md`를 최우선으로 업데이트합니다.

### 2단계: 문서 업데이트 (Source of Truth 유지)
- **원칙:** 코드를 고치기 전, 관련 PRD의 체크리스트와 명세를 먼저 최신화합니다.
- **분리:** 구현 기술 상세(`02_feat_`)와 비즈니스 로직(`01_logic_`)을 분리하여 기록합니다.

### 3단계: 구현 (Plan -> Act -> Validate)
- **Plan:** 업데이트된 PRD를 기반으로 구체적인 코드 수정 계획 수립.
- **Act:** FSD 레이어에 맞춰 기능 구현.
- **Validate:** PRD의 '최종 체크리스트'를 기준으로 테스트 및 검증 수행.

### 3단계: 최종 검증
- Playwright를 활용한 핵심 사용자 시나리오(E2E) 테스트 통과 확인

---

## 🤖 AI 분석 워크플로우 (심화)

1.  **수집:** Nitter RSS를 통해 데이터 수집 (안정성을 위해 여러 인스턴스 주소 관리)
2.  **필터링:** Gemini API를 통해 '경제 문맥' 분석 (Zod를 사용해 AI 응답 구조 강제화)
3.  **저장:** Supabase Edge Functions 또는 서버 액션을 통한 데이터 영속화
4.  **전송:** 사용자 구독 설정에 따른 알림 서비스 연동

---

## 📝 코딩 컨벤션 및 개발 원칙

- **타입 안정성:** 모든 API 요청과 응답, Form 데이터는 Zod 스키마를 통해 검증합니다.
- **주석 및 문서화:**
  - 모든 파일(컴포넌트, 훅, 유틸리티 등)의 최상단에는 해당 파일의 역할을 설명하는 간단한 주석을 포함합니다.
  - 모든 `interface`, `type` 정의(Props 포함) 시에는 반드시 **JSDoc 스타일(`/** ... */`) 주석**을 추가하여 IDE에서 속성의 의미를 즉시 파악할 수 있게 합니다.
  - 모든 **함수(컴포넌트, 훅, 일반 유틸리티 함수 등)** 정의 시에도 반드시 **JSDoc 스타일(`/** ... */`) 주석**을 추가하여 매개변수와 반환값의 의미를 명시합니다.
- **스타일 가이드:** `text`, `border`, `padding`, `margin` 등 UI 수치 지정 시 직접적인 픽셀 값(`px`, `[10px]`) 사용을 최소화합니다. 대신 Tailwind CSS의 표준 토큰(`xs`, `sm`, `base`, `lg`, `xl` 등)을 우선적으로 사용하여 디자인 일관성을 유지합니다.
- **서버 우선:** 데이터 fetching은 가급적 RSC(React Server Components)에서 수행하되, 클라이언트 상태 관리가 필요한 경우 TanStack Query를 사용합니다.
- **테스트 필수:** 모든 기능 구현은 해당 비즈니스 로직을 검증하는 테스트 코드가 동반되어야 합니다.
- **테스트 주석 규칙:** 모든 테스트 파일(`.test.ts`, `.spec.ts`)의 최상단 첫 줄에는 해당 테스트를 실행할 수 있는 전체 명령어(예: `// pnpm test src/...`)를 주석으로 반드시 포함합니다.

---

## 🔒 커밋 및 형상 관리 규칙 (Strict Policy)

1. **자동 커밋 금지:** 어떠한 도구(CLI, 스크립트 등)도 사용자의 명시적 요청 없이 커밋을 생성해서는 안 됩니다.
2. **DB 스키마 및 RPC 동기화 (Absolute Rule):** 
   - 신규 마이그레이션 파일(`infra/supabase/migration_*.sql`)이 생성되거나 DB 함수(RPC)가 수정되면, **반드시 그 내용을 `infra/supabase/schema.sql`에 즉시 반영**해야 한다.
   - `schema.sql`은 항상 최신 상태를 유지해야 하며, 새로운 인프라 환경에서 이 파일 하나만 실행해도 현재와 동일한 테이블, 인덱스, Seed 데이터, RPC 함수가 완벽하게 세팅되어야 한다.
   - 모든 작업 단계에서 DB 관련 변경이 있다면 `schema.sql` 업데이트 여부를 최우선으로 확인한다.
3. **커밋 워크플로우:**
   - 기능 구현 완료 및 테스트 코드 작성
   - `pnpm test` 등을 통한 테스트 통과 확인
   - 사용자에게 테스트 결과 알림 및 커밋 의사 확인
   - 사용자가 "커밋해"라고 하면, **커밋 메시지를 먼저 출력**하고 최종 승인 요청
   - 최종 승인 시에만 `git commit` 수행
3. **커밋 메시지 규칙:**
   - **사전 상태 확인:** 커밋 메시지 작성 전 반드시 `git status`와 `git diff`(스테이징 미포함) 및 `git diff --cached`(스테이징 포함)를 모두 실행하여 작업 디렉토리 내의 **모든 변경 사항**을 정확히 파악해야 한다.
   - **변경분 전수 반영:** 스테이징 여부와 상관없이 현재 '수정된 모든 내용'을 기준으로 메시지를 작성하며, 이미 이전 커밋에 포함된 내용은 제외한다.
   - **제목:** 제목을 쓴다. (feat:, fix: 등의 프리픽스 권장)
   - **구분:** 제목과 본문 사이에는 엔터를 두 번 입력하여 빈 줄을 '딱 하나'만 만든다.
   - **본문:** 각 항목은 앞에 공백 없이 줄의 시작점부터 '- '로 시작한다.
   - **형식:** 순수 텍스트로만 출력한다. (마크다운 코드 블록이나 리스트 문법 사용 금지)

---

## ⚠️ 리스크 및 검토 사항 (Deep Analysis)

- **AI 응답 일관성:** Gemini 응답이 항상 동일한 JSON 구조를 갖도록 프롬프트 엔지니어링 및 Zod 파싱 적용.
- **Nitter 가용성:** `nitter.net` 외 다수의 인스턴스 리스트를 `shared/config`에 유지 및 실패 시 자동 폴백(Fallback) 로직 구현.
- **데이터 중복:** 동일한 트윗이 여러 번 수집되지 않도록 Twitter ID 기반의 Unique Constraint 설정.
- **Rate Limit:** Gemini 무료 티어의 RPM 제한을 준수하기 위한 배치 처리(Batch Processing) 로직 필요.
