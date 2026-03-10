/**
 * TanStack Query(React Query)의 Provider 설정을 담당하는 모듈입니다.
 */
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

/**
 * 애플리케이션 전체에 React Query 상태를 주입하는 Provider 컴포넌트입니다.
 * @param {Object} props 컴포넌트 Props
 * @param {ReactNode} props.children 하위 컴포넌트
 * @returns {JSX.Element} QueryClientProvider로 래핑된 하위 컴포넌트
 */
export function ReactQueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
