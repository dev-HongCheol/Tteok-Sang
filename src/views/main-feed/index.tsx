/**
 * 서비스 메인 대시보드인 피드 목록 페이지 뷰입니다.
 */
'use client';

import { useQuery } from '@tanstack/react-query';
import { endOfDay, startOfDay } from 'date-fns';
import { Loader2, Settings, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { type GetInsightsParams, getInsights } from '@/entities/insight/api/insight';
import type { MarketType } from '@/entities/insight/model/types';
import { FeedFilter } from '@/features/filter-insights/ui/FeedFilter';
import { InsightCard } from '@/widgets/insight-card/ui/InsightCard';

/**
 * 메인 피드 대시보드 뷰 컴포넌트입니다.
 * 고도화된 AI 분석 인사이트를 필터링하여 실시간으로 확인합니다.
 * @returns {JSX.Element} 메인 피드 대시보드 UI
 */
export default function MainFeedView() {
  const today = new Date();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfDay(today),
    to: endOfDay(today),
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExpertIds, setSelectedExpertIds] = useState<string[] | undefined>(undefined);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [selectedImportances, setSelectedImportances] = useState<string[]>(['High', 'Medium']);
  const [selectedMarkets, setSelectedMarkets] = useState<MarketType[]>([]);

  /** API 요청 파라미터 구성 */
  const queryParams: GetInsightsParams = {
    sectors: selectedSectors,
    importances: selectedImportances,
    marketTypes: selectedMarkets,
    expertIds: selectedExpertIds,
    startDate: dateRange?.from?.toISOString(),
    endDate: dateRange?.to?.toISOString(),
    searchQuery,
  };

  /** 인사이트 데이터 페칭 (TanStack Query) */
  const {
    data: insights,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['insights', queryParams],
    queryFn: () => getInsights(queryParams),
  });

  return (
    <div className='min-h-screen bg-background text-foreground'>
      <div className='container mx-auto py-4 px-4'>
        <header className='mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/50 pb-4'>
          <div>
            <div className='flex items-center gap-3 mb-2'>
              <div className='p-2 bg-primary rounded-xl shadow-lg shadow-primary/20'>
                <TrendingUp className='w-7 h-7 text-primary-foreground' />
              </div>
              <h1 className='text-2xl font-black tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent'>
                Tteok-Sang
              </h1>
            </div>
            <p className='text-muted-foreground text-lg font-medium flex justify-between items-center gap-3'>
              <span>실시간 투자 센티먼트 레이더</span>
              <Link href={'/admin/experts'} title='설정페이지 이동'>
                <Settings className='size-5 hover:rotate-90 transition-transform duration-300' />
              </Link>
            </p>
          </div>
        </header>

        <div className='grid grid-cols-1 lg:grid-cols-4 gap-8'>
          {/* 사이드바 필터 */}
          <aside className='lg:col-span-1'>
            <FeedFilter
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedExpertIds={selectedExpertIds}
              onExpertsChange={setSelectedExpertIds}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              selectedSectors={selectedSectors}
              onSectorsChange={setSelectedSectors}
              selectedImportances={selectedImportances}
              onImportancesChange={setSelectedImportances}
              selectedMarkets={selectedMarkets}
              onMarketsChange={setSelectedMarkets}
            />
          </aside>

          {/* 메인 인사이트 목록 */}
          <main className='lg:col-span-3'>
            {isLoading ? (
              <div className='flex flex-col items-center justify-center py-32 space-y-4'>
                <Loader2 className='h-12 w-12 animate-spin text-primary/60' />
                <p className='text-muted-foreground font-bold animate-pulse'>데이터 분석 중...</p>
              </div>
            ) : isError ? (
              <div className='text-center py-20 bg-destructive/5 rounded-2xl border border-destructive/20'>
                <p className='text-destructive font-bold text-xl'>데이터 로드에 실패했습니다.</p>
                <p className='text-muted-foreground mt-2'>잠시 후 다시 시도해 주세요.</p>
              </div>
            ) : !insights || insights.length === 0 ? (
              <div className='text-center py-32 bg-muted/10 rounded-2xl border-2 border-dashed border-border/50'>
                <p className='text-muted-foreground text-2xl font-bold tracking-tight'>
                  표시할 인사이트가 없습니다.
                </p>
                <p className='text-muted-foreground/60 mt-2 font-medium text-lg'>
                  필터 조건을 변경하거나 새로운 피드가 수집될 때까지 기다려 주세요.
                </p>
              </div>
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500'>
                {insights.map((insight) => (
                  <InsightCard key={insight.id} insight={insight} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
