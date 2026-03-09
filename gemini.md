# 🚀 Tteok-Sang (떡상) - AI 경제 피드 큐레이터

이 파일은 프로젝트의 규칙과 가이드라인을 담고 있습니다. 모든 개발 작업은 이 가이드를 최우선으로 준수합니다.

---

## 🛠️ 프로젝트 정보 및 기술 스택

- **Deployment URL:** [https://tteok-sang.devhong.cc](https://tteok-sang.devhong.cc)
- **Framework:** Next.js (Latest, App Router)
- **Language:** TypeScript
- **Package Manager:** `pnpm`
- **UI:** shadcn/ui, Tailwind CSS
- **State Management/Data Fetching:** Axios, TanStack Query (v5)
- **Form & Validation:** React Hook Form, Zod
- **Database/Auth:** Self-hosted Supabase ([https://supa.devhong.cc](https://supa.devhong.cc))
- **AI Model:** Gemini 2.0 Flash (무료 티어)
- **Architecture:** Feature-Sliced Design (FSD)
- **Testing:** Vitest, React Testing Library, Playwright (E2E)

---

## 📁 아키텍처 규칙 (FSD)

모든 소스코드는 `src/` 폴더 내에 위치하며 다음 계층 구조를 엄격히 따릅니다.

1.  **app/**: Next.js App Router 정의 (레이아웃, 전역 설정)
2.  **pages/**: 실제 페이지 구성 요소 (데이터 fetching 및 템플릿 조합)
3.  **widgets/**: 독립적인 UI 블록 (예: FeedCard, Navigation Bar)
4.  **features/**: 사용자 상호작용 및 비즈니스 로직 (예: AnalyzeFeed, SubscribeToggle)
5.  **entities/**: 비즈니스 엔티티 (예: Feed, User, Insight 데이터 타입 및 기본 스토어)
6.  **shared/**: 공통 컴포넌트 (UI 라이브러리), API 클라이언트, 유틸리티, 상수

---

## 🔄 개발 워크플로우 (PRD 기반)

새로운 기능을 추가할 때는 반드시 다음 단계를 거칩니다.

### 1단계: PRD 작성
- **경로:** `document/prd/[기능명].md` 생성
- **내용:** 
  - 요구사항 정의 (User Stories)
  - 기술적 구현 상세 (API 설계, DB 스키마 변경점)
  - 단계별 구현 로드맵
  - 최종 구현 체크리스트 (기능 및 테스트 케이스 포함)

### 2단계: 구현 (Plan -> Act -> Validate)
- **Plan:** PRD를 기반으로 구체적인 코드 수정 계획 수립
- **Act:** FSD 레이어에 맞춰 기능 구현 및 `shared/api` 등을 통한 통신 계층 작성
- **Validate:** 단위 테스트(Vitest) 및 통합 테스트 수행

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
- **서버 우선:** 데이터 fetching은 가급적 RSC(React Server Components)에서 수행하되, 클라이언트 상태 관리가 필요한 경우 TanStack Query를 사용합니다.
- **테스트 필수:** 모든 기능 구현은 해당 비즈니스 로직을 검증하는 테스트 코드가 동반되어야 합니다.

---

## 🔒 커밋 및 형상 관리 규칙 (Strict Policy)

1. **자동 커밋 금지:** 어떠한 도구(CLI, 스크립트 등)도 사용자의 명시적 요청 없이 커밋을 생성해서는 안 됩니다.
2. **커밋 워크플로우:**
   - 기능 구현 완료 및 테스트 코드 작성
   - `pnpm test` 등을 통한 테스트 통과 확인
   - 사용자에게 테스트 결과 알림 및 커밋 의사 확인
   - 사용자가 "커밋해"라고 하면, **커밋 메시지를 먼저 출력**하고 최종 승인 요청
   - 최종 승인 시에만 `git commit` 수행
3. **커밋 메시지 규칙:**
   - 제목을 쓴다.
   - 엔터를 두 번 입력하여 빈 줄을 '딱 하나'만 만든다.
   - 본문의 각 항목은 앞에 공백 없이 줄의 시작점부터 '- '로 시작한다.
   - 순수 텍스트로만 출력 (마크다운 리스트/코드 블록 금지)

---

## ⚠️ 리스크 및 검토 사항 (Deep Analysis)

- **AI 응답 일관성:** Gemini 응답이 항상 동일한 JSON 구조를 갖도록 프롬프트 엔지니어링 및 Zod 파싱 적용.
- **Nitter 가용성:** `nitter.net` 외 다수의 인스턴스 리스트를 `shared/config`에 유지 및 실패 시 자동 폴백(Fallback) 로직 구현.
- **데이터 중복:** 동일한 트윗이 여러 번 수집되지 않도록 Twitter ID 기반의 Unique Constraint 설정.
- **Rate Limit:** Gemini 무료 티어의 RPM 제한을 준수하기 위한 배치 처리(Batch Processing) 로직 필요.
