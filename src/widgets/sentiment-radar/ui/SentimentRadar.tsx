/**
 * 최근 24시간 또는 특정 기간 시장의 종목별 센티먼트와 전반적인 분위기를 시각화하는 위젯입니다.
 */
'use client';

import { useQuery } from '@tanstack/react-query';
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import { getStockSentimentRanking } from '@/entities/insight/api/insight';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Calendar } from '@/shared/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { MonthPicker } from './MonthPicker';
import { SentimentDetailDialog } from './SentimentDetailDialog';
import { SentimentItemCard } from './SentimentItemCard';
import { SentimentRadarSkeleton } from './SentimentRadarSkeleton';
import { YearPicker } from './YearPicker';

type PeriodType = 'day' | 'week' | 'month' | 'year';

interface SentimentRadarProps {
  /** 외부에서 주입되는 시작일 (메인 페이지 연동용) */
  startDate?: string;
  /** 외부에서 주입되는 종료일 (메인 페이지 연동용) */
  endDate?: string;
}

/**
 * 시장 센티먼트 레이더 위젯 컴포넌트
 * @param {SentimentRadarProps} props 외부 필터 연동용 props
 * @returns {JSX.Element} 센티먼트 요약 및 종목 랭킹 UI
 */
export function SentimentRadar({ startDate: propsStartDate, endDate: propsEndDate }: SentimentRadarProps) {
  // 1. 상태 관리: 외부 props가 있으면 그 값을 쓰고, 없으면 내부 상태를 사용
  const isExternalFilter = !!propsStartDate && !!propsEndDate;
  
  const [internalDate, setInternalDate] = useState<Date>(new Date());
  const [periodType, setPeriodType] = useState<PeriodType>('day');

  // 상세 모달 상태
  const [selectedTicker, setSelectedTicker] = useState<{ ticker: string; name: string } | null>(
    null,
  );

  // 2. 조회 기간 결정
  const getRange = (baseDate: Date, type: PeriodType) => {
    switch (type) {
      case 'day': return { start: startOfDay(baseDate), end: endOfDay(baseDate) };
      case 'week': return { start: startOfWeek(baseDate), end: endOfWeek(baseDate) };
      case 'month': return { start: startOfMonth(baseDate), end: endOfMonth(baseDate) };
      case 'year': return { start: startOfYear(baseDate), end: endOfYear(baseDate) };
    }
  };

  const internalRange = getRange(internalDate, periodType);
  
  // 최종적으로 사용할 ISO 문자열 범위
  const finalStart = propsStartDate || internalRange.start.toISOString();
  const finalEnd = propsEndDate || internalRange.end.toISOString();

  // 랭킹 데이터 조회
  const { data: ranking, isLoading } = useQuery({
    queryKey: ['stock-sentiment-ranking', finalStart, finalEnd],
    queryFn: () => getStockSentimentRanking(finalStart, finalEnd),
    refetchInterval:
      !isExternalFilter && periodType === 'day' && format(internalDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
        ? 1000 * 60 * 60
        : undefined,
  });

  if (isLoading) return <SentimentRadarSkeleton />;

  const rankings = ranking || [];
  
  // 데이터 정렬 및 추출
  const bullishTop5 = [...rankings]
    .filter(item => item.total_score > 0)
    .sort((a, b) => b.total_score - a.total_score)
    .slice(0, 5);

  const bearishTop5 = [...rankings]
    .filter(item => item.total_score < 0)
    .sort((a, b) => a.total_score - b.total_score)
    .slice(0, 5);

  const totalMarketScore = rankings.reduce((acc, curr) => acc + curr.total_score, 0) || 0;

  const mood = getMarketMood(totalMarketScore);

  const moveDate = (amount: number) => {
    if (isExternalFilter) return; // 외부 필터 사용 시 이동 불가
    const newDate = new Date(internalDate);
    if (periodType === 'day') newDate.setDate(internalDate.getDate() + amount);
    if (periodType === 'week') newDate.setDate(internalDate.getDate() + amount * 7);
    if (periodType === 'month') newDate.setMonth(internalDate.getMonth() + amount);
    if (periodType === 'year') newDate.setFullYear(internalDate.getFullYear() + amount);
    setInternalDate(newDate);
  };

  return (
    <div className='space-y-10 mb-8'>
      {/* 1. 헤더 및 컨트롤 영역 */}
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
        <div className='flex items-center gap-2'>
          <Target className='w-5 h-5 text-primary' />
          <h2 className='text-lg font-bold tracking-tight'>실시간 센티먼트 레이더</h2>
          <div
            className={cn(
              'ml-2 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1.5 border border-current/20',
              mood.bg,
              mood.color,
            )}
          >
            <span className='w-1.5 h-1.5 rounded-full bg-current animate-pulse' />
            {mood.label}
          </div>
        </div>

        {!isExternalFilter && (
          <div className='flex items-center gap-2 bg-muted/30 p-1 rounded-lg border border-border/50'>
            <div className='flex items-center border-r border-border/50 pr-2 mr-1'>
              {(['day', 'week', 'month', 'year'] as PeriodType[]).map((t) => (
                <Button
                  key={t}
                  variant='ghost'
                  size='sm'
                  onClick={() => setPeriodType(t)}
                  className={cn(
                    'h-7 px-2.5 text-[11px] font-bold transition-all',
                    periodType === t
                      ? 'bg-background shadow-sm text-primary'
                      : 'text-muted-foreground',
                  )}
                >
                  {t === 'day' ? '일' : t === 'week' ? '주' : t === 'month' ? '월' : '년'}
                </Button>
              ))}
            </div>

            <div className='flex items-center gap-1'>
              <Button variant='ghost' size='icon' className='h-7 w-7' onClick={() => moveDate(-1)}>
                <ChevronLeft className='h-4 w-4' />
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='h-7 px-2 gap-1.5 text-xs font-medium text-left min-w-[140px]'
                  >
                    <CalendarIcon className='h-3.5 w-3.5 opacity-60' />
                    {format(internalRange.start, 'yyyy.MM.dd')}
                    {periodType !== 'day' && ` - ${format(internalRange.end, 'MM.dd')}`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0' align='end'>
                  {periodType === 'day' || periodType === 'week' ? (
                    <Calendar
                      mode='single'
                      selected={internalDate}
                      onSelect={(d) => d && setInternalDate(d)}
                      initialFocus
                      locale={ko}
                    />
                  ) : periodType === 'month' ? (
                    <MonthPicker date={internalDate} onChange={setInternalDate} />
                  ) : (
                    <YearPicker date={internalDate} onChange={setInternalDate} />
                  )}
                </PopoverContent>
              </Popover>

              <Button variant='ghost' size='icon' className='h-7 w-7' onClick={() => moveDate(1)}>
                <ChevronRight className='h-4 w-4' />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 2. 호재 TOP 5 섹션 */}
      <div className='space-y-3'>
        <div className='flex items-center gap-2 px-1'>
          <TrendingUp className='w-4 h-4 text-emerald-500' />
          <h3 className='text-sm font-bold text-emerald-500 uppercase tracking-wider'>급상승 센티먼트 TOP 5</h3>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-5 gap-3'>
          {bullishTop5.length === 0 ? (
            <div className='col-span-5 h-24 flex items-center justify-center border-2 border-dashed border-border/40 rounded-xl bg-muted/5 text-muted-foreground text-xs font-medium'>
              상승 종목이 없습니다.
            </div>
          ) : (
            bullishTop5.map((item) => (
              <SentimentItemCard key={item.ticker} item={item} onSelect={setSelectedTicker} />
            ))
          )}
        </div>
      </div>

      {/* 3. 악재 TOP 5 섹션 */}
      <div className='space-y-3'>
        <div className='flex items-center gap-2 px-1'>
          <TrendingDown className='w-4 h-4 text-rose-500' />
          <h3 className='text-sm font-bold text-rose-500 uppercase tracking-wider'>급하락 센티먼트 TOP 5</h3>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-5 gap-3'>
          {bearishTop5.length === 0 ? (
            <div className='col-span-5 h-24 flex items-center justify-center border-2 border-dashed border-border/40 rounded-xl bg-muted/5 text-muted-foreground text-xs font-medium'>
              하락 종목이 없습니다.
            </div>
          ) : (
            bearishTop5.map((item) => (
              <SentimentItemCard key={item.ticker} item={item} onSelect={setSelectedTicker} />
            ))
          )}
        </div>
      </div>

      {/* 4. 상세 분석 모달 */}
      <SentimentDetailDialog
        selectedTicker={selectedTicker}
        onClose={() => setSelectedTicker(null)}
        range={{ start: new Date(finalStart), end: new Date(finalEnd) }}
      />
    </div>
  );
}

// 헬퍼 함수
const getMarketMood = (score: number) => {
  if (score > 20) return { label: '매우 낙관', color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
  if (score > 5) return { label: '낙관', color: 'text-emerald-400', bg: 'bg-emerald-400/10' };
  if (score < -20) return { label: '매우 공포', color: 'text-rose-500', bg: 'bg-rose-500/10' };
  if (score < -5) return { label: '공포', color: 'text-rose-400', bg: 'bg-rose-400/10' };
  return { label: '중립', color: 'text-slate-400', bg: 'bg-slate-400/10' };
};
