/**
 * 관리자 - 전문가 관리 페이지 모듈입니다.
 */
import ExpertsPage from '@/views/admin/experts';

/** 전문가 관리 페이지 메타데이터 설정 */
export const metadata = {
  title: '떡상(Tteok-Sang) 가즈아 - 관리자',
  description: 'AI 경제 피드 수집 대상 전문가 관리 페이지',
};

/**
 * 전문가 관리 페이지 컴포넌트입니다.
 * @returns {JSX.Element} 전문가 관리 뷰
 */
export default function Page() {
  return <ExpertsPage />;
}
