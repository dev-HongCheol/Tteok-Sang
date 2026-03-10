/**
 * 등록된 전문가 전체 목록을 조회하여 리스트 형태로 표시하는 컴포넌트입니다.
 */
'use client';

import { useQuery } from '@tanstack/react-query';
import { getExperts } from '@/entities/expert/api/expert';
import { ExpertItem } from './ExpertItem';
import { Card, CardContent } from '@/shared/ui/card';
import { Loader2 } from 'lucide-react';

/**
 * 모든 전문가를 불러와 ExpertItem 컴포넌트의 리스트로 렌더링합니다.
 * @returns {JSX.Element} 전문가 목록 UI
 */
export function ExpertList() {
  const { data: experts, isLoading, isError } = useQuery({
    queryKey: ['experts'],
    queryFn: getExperts,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center p-8 text-destructive">
        전문가 목록을 불러오는 중 오류가 발생했습니다.
      </div>
    );
  }

  if (!experts || experts.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground border-2 border-dashed rounded-lg">
        등록된 전문가가 없습니다. 상단에서 추가해주세요.
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex flex-col">
          {experts.map((expert) => (
            <ExpertItem key={expert.id} expert={expert} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
