/**
 * 애플리케이션의 공통 레이아웃을 정의하는 모듈입니다.
 */
import type { Metadata } from 'next';
import './globals.css';
import 'pretendard/dist/web/static/pretendard.css';
import { ReactQueryProvider } from '@/shared/lib/react-query/provider';
import { Toaster } from '@/shared/ui/sonner';

/** 애플리케이션 기본 메타데이터 설정 */
export const metadata: Metadata = {
  title: 'Tteok-Sang (떡상)',
  description: 'AI 경제 피드 큐레이터',
};

/**
 * 애플리케이션의 최상위 레이아웃 컴포넌트입니다.
 * @param {Object} props 컴포넌트 Props
 * @param {React.ReactNode} props.children 하위 컴포넌트
 * @returns {JSX.Element} 폰트 및 Provider가 적용된 HTML 구조
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // dark 클래스를 추가하여 다크모드 고정
    <html lang="ko" className="dark" style={{ colorScheme: 'dark' }}>
      <body className="antialiased bg-background text-foreground font-sans">
        <ReactQueryProvider>
          {children}
          <Toaster position="top-center" richColors />
        </ReactQueryProvider>
      </body>
    </html>
  );
}
