# 🚀 Tteok-Sang (떡상) - 배포 및 인프라 명세 (PRD)

이 문서는 Tteok-Sang 프로젝트의 Vercel 기반 배포 전략과 필요한 환경 변수, 인프라 구성을 정의합니다.

---

## 🏗️ 1. 배포 전략 (Deployment Strategy)

- **Platform:** Vercel (Next.js 최적화)
- **Deployment Type:** Git-based CI/CD (Main branch push 시 자동 배포)
- **Framework:** Next.js (App Router)
- **Package Manager:** `pnpm` (Latest)
- **Edge Runtime:** 필요 시 분석 파이프라인 엔드포인트에 Edge Runtime 적용 검토

---

## 🔐 2. 환경 변수 구성 (Environment Variables)

Vercel 대시보드에 다음 환경 변수들을 반드시 등록해야 합니다.

### 2.1 Supabase 연동 (Public)
- **`NEXT_PUBLIC_SUPABASE_URL`:** Supabase 프로젝트 API URL
- **`NEXT_PUBLIC_SUPABASE_ANON_KEY`:** Supabase 익명 접근 키 (Client-side 용)

### 2.2 API 및 보안 (Secret)
- **`GEMINI_API_KEY`:** Google Gemini API (gemini-3.1-flash-lite-preview) 사용을 위한 키
- **`SUPABASE_SERVICE_ROLE_KEY`:** 서버 사이드 및 크론 작업 시 권한 우회를 위해 필요한 시크릿 키

### 2.3 애플리케이션 설정
- **`NEXT_PUBLIC_SITE_URL`:** 배포된 실제 서비스 URL (https://tteok-sang.devhong.cc)

---

## 🛠️ 3. 빌드 및 설정 (Build Settings)

- **Build Command:** `pnpm build`
- **Output Directory:** `.next`
- **Install Command:** `pnpm install`
- **Node.js Version:** 20.x 이상 권장

---

## ✅ 4. 최종 체크리스트 (Final Checklist)

- [x] Vercel 프로젝트 생성 및 GitHub 저장소 연결 완료
- [x] 모든 필수 환경 변수(`GEMINI_API_KEY`, `SUPABASE_URL` 등) 등록 완료
- [x] `pnpm build` 로컬 실행 시 에러 발생 여부 확인
- [x] 도메인(`tteok-sang.devhong.cc`) 연결 및 SSL 활성화 확인
- [x] 배포 후 실제 API 호출(Gemini 분석, Supabase 저장) 정상 작동 여부 확인
