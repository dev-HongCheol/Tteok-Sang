'use client';

import { AddExpertForm } from '@/features/manage-experts/ui/AddExpertForm';
import { ExpertList } from '@/features/manage-experts/ui/ExpertList';

export default function ExpertsPage() {
  return (
    <div className='container max-w-2xl mx-auto py-10 px-4'>
      <header className='mb-10'>
        <h1 className='text-3xl font-bold tracking-tight'>전문가 관리</h1>
        <p className='text-muted-foreground mt-2'>
          수집할 트위터(X) 전문가 목록을 관리하세요. 새로운 트윗은 1시간마다 자동으로 동기화됩니다.
        </p>
      </header>

      <section>
        <h2 className='text-xl font-semibold mb-4'>새 전문가 추가</h2>
        <AddExpertForm />
      </section>

      <section>
        <h2 className='text-xl font-semibold mb-4'>등록된 전문가 리스트</h2>
        <ExpertList />
      </section>
    </div>
  );
}
