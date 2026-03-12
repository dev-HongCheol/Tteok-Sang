/**
 * 센티먼트 레이더 로딩 상태를 보여주는 스켈레톤 컴포넌트입니다.
 */
'use client';

import { Skeleton } from '@/shared/ui/skeleton';

export function SentimentRadarSkeleton() {
  return (
    <div className='space-y-4 mb-8'>
      <div className='flex items-center justify-between'>
        <Skeleton className='h-6 w-48' />
        <Skeleton className='h-6 w-24 rounded-full' />
      </div>
      <div className='grid grid-cols-1 md:grid-cols-5 gap-3'>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className='h-32 w-full rounded-xl border-border/40' />
        ))}
      </div>
    </div>
  );
}
