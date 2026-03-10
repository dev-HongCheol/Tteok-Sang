/**
 * 서비스의 메인 엔트리 페이지 모듈입니다.
 */
import MainFeedView from '@/views/main-feed';

/**
 * 서비스 홈(/) 페이지 컴포넌트입니다.
 * @returns {JSX.Element} 메인 피드 뷰
 */
export default function Home() {
  return <MainFeedView />;
}
