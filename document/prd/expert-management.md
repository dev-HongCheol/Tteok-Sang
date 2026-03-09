# PRD: 전문가 관리 기능 (Expert Management)

## 1. 개요
- **목표:** 웹 UI를 통해 수집 대상 전문가(트위터 핸들)를 추가, 삭제, 조회할 수 있는 관리 기능을 구축한다.
- **주요 작업:** 전문가 CRUD API 구현, 전문가 등록 폼 및 목록 UI 개발, TanStack Query를 이용한 상태 관리.

## 2. 사용자 스토리
- "관리자는 새로운 전문가의 이름과 트위터 핸들을 입력하여 수집 대상으로 등록할 수 있다."
- "관리자는 현재 등록된 전문가 리스트를 확인하고, 더 이상 수집을 원하지 않는 전문가를 삭제할 수 있다."
- "관리자는 전문가별로 마지막 수집 시점을 한눈에 확인할 수 있다."

## 3. 기술적 상세 및 요구사항

### 3.1 API 및 상태 관리
- **Entity API:** `src/entities/expert/api/`에 Supabase 연동 로직 작성.
- **State Management:** `TanStack Query`를 사용하여 목록 조회, 추가, 삭제 후 자동 리프레시 처리.
- **Validation:** `Zod`와 `React Hook Form`을 사용하여 트위터 핸들 입력값 검증.

### 3.2 UI 구성 (shadcn/ui 활용)
- **목록:** `Table` 컴포넌트를 사용하여 ID, 이름, 핸들, 마지막 동기화 시간 표시.
- **등록:** `Input`, `Button`, `Dialog` 또는 섹션을 사용하여 등록 폼 제공.

## 4. 단계별 구현 로드맵

### 1단계: API 및 엔티티 로직 구축
- [ ] `src/entities/expert/api/expert.ts` 작성 (fetch, insert, delete 함수).

### 2단계: UI 컴포넌트 개발 (Features)
- [ ] `src/features/manage-experts/ui/AddExpertForm.tsx` 작성 (등록 폼).
- [ ] `src/features/manage-experts/ui/ExpertTable.tsx` 작성 (목록 및 삭제 버튼).

### 3단계: 관리 페이지 구성 (Pages & App)
- [ ] `src/pages/admin/experts/` 페이지 컴포넌트 작성.
- [ ] `src/app/admin/experts/page.tsx` 라우트 생성.

## 5. 최종 체크리스트 (Validation)
- [ ] 새로운 전문가 등록 시 목록에 즉시 반영되는가?
- [ ] 삭제 시 확인 절차를 거치고 DB에서 정상적으로 제거되는가?
- [ ] 잘못된 트위터 핸들 형식 입력 시 에러 메시지를 보여주는가?
