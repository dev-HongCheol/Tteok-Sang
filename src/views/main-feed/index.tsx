'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getInsights, type GetInsightsParams } from '@/entities/insight/api/insight';
import { InsightCard } from '@/widgets/insight-card/ui/InsightCard';
import { FeedFilter } from '@/features/filter-insights/ui/FeedFilter';
import type { DateRange } from 'react-day-picker';
import { Loader2, TrendingUp } from 'lucide-react';
import { startOfDay, endOfDay } from 'date-fns';

export default function MainFeedView() {
  const today = new Date();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfDay(today),
    to: endOfDay(today),
  });

  const [searchQuery, setSearchQuery] = useState('');
  // 초기값을 undefined로 설정하여 '전체 선택' 상태로 시작
  const [selectedExpertIds, setSelectedExpertIds] = useState<string[] | undefined>(undefined);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const queryParams: GetInsightsParams = {
    categories: selectedCategories,
    expertIds: selectedExpertIds,
    startDate: dateRange?.from?.toISOString(),
    endDate: dateRange?.to?.toISOString(),
    searchQuery,
  };

  const { data: insights, isLoading, isError } = useQuery({
    queryKey: ['insights', queryParams],
    queryFn: () => getInsights(queryParams),
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto py-10 px-4">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/50 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary rounded-xl shadow-lg shadow-primary/20">
                <TrendingUp className="w-7 h-7 text-primary-foreground" />
              </div>
              <h1 className="text-4xl font-black tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
                Tteok-Sang
              </h1>
            </div>
            <p className="text-muted-foreground text-lg font-medium">
              전문가 인사이트 실시간 AI 요약 피드
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            <FeedFilter
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedExpertIds={selectedExpertIds}
              onExpertsChange={setSelectedExpertIds}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              selectedCategories={selectedCategories}
              onCategoriesChange={setSelectedCategories}
            />
          </aside>

          <main className="lg:col-span-3">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary/60" />
                <p className="text-muted-foreground font-medium animate-pulse">데이터 분석 중...</p>
              </div>
            ) : isError ? (
              <div className="text-center py-20 bg-destructive/5 rounded-2xl border border-destructive/20">
                <p className="text-destructive font-bold text-xl">데이터 로드에 실패했습니다.</p>
                <p className="text-muted-foreground mt-2">잠시 후 다시 시도해 주세요.</p>
              </div>
            ) : !insights || insights.length === 0 ? (
              <div className="text-center py-32 bg-muted/10 rounded-2xl border-2 border-dashed border-border/50">
                <p className="text-muted-foreground text-2xl font-bold tracking-tight">표시할 인사이트가 없습니다.</p>
                <p className="text-muted-foreground/60 mt-2 font-medium text-lg">필터 조건을 변경하거나 내일 다시 확인해 보세요!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500">
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
