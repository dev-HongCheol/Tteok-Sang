/**
 * 관리자 전용 전문가 및 시스템 관리 페이지 뷰입니다.
 */
'use client';

import { AddExpertForm } from '@/features/manage-experts/ui/AddExpertForm';
import { ExpertList } from '@/features/manage-experts/ui/ExpertList';
import { PipelineLogs } from '@/features/manage-system/ui/PipelineLogs';
import { SystemSettings } from '@/features/manage-system/ui/SystemSettings';

/**
 * 전문가 관리 및 시스템 설정을 위한 관리자 페이지 컴포넌트입니다.
 * @returns {JSX.Element} 전문가 관리 페이지 UI
 */
export default function ExpertsPage() {
  return (
    <div className='container max-w-7xl mx-auto py-4 px-4'>
      <header className='mb-2 text-center'>
        <h1 className='text-2xl font-bold tracking-tight'>Tteok-Sang Admin</h1>
        <p className='text-muted-foreground mt-2'>AI 경제 피드 큐레이터 관리 시스템</p>
      </header>

      <div className='grid grid-cols-1 md:grid-cols-7 gap-8'>
        {/* 오른쪽: 전문가 관리 */}
        <div className='md:col-span-3'>
          <h2 className='text-xl font-semibold mb-4'>수집 대상 전문가</h2>
          <AddExpertForm />
          <ExpertList />
        </div>
        {/* 왼쪽: 시스템 설정 및 로그 */}
        <div className='md:col-span-4'>
          <h2 className='text-xl font-semibold mb-4'>시스템 관리</h2>
          <SystemSettings />
          <PipelineLogs />
        </div>
      </div>
    </div>
  );
}
