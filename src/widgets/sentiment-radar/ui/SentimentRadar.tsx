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
  Maximize2,
  Minus,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { getStockSentimentRanking } from '@/entities/insight/api/insight';
import type { StockSentimentRanking } from '@/entities/insight/model/types';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Calendar } from '@/shared/ui/calendar';
import { Card } from '@/shared/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { MonthPicker } from './MonthPicker';
import { SentimentDetailDialog } from './SentimentDetailDialog';
import { SentimentItemCard } from './SentimentItemCard';
import { SentimentMarketMap } from './SentimentMarketMap';
import { SentimentRadarSkeleton } from './SentimentRadarSkeleton';
import { YearPicker } from './YearPicker';

type PeriodType = 'day' | 'week' | 'month' | 'year';
type DataScale = 10 | 25 | 150 | 0; // 0은 전체(All)

interface SentimentRadarProps {
  /** 외부에서 주입되는 시작일 (메인 페이지 연동용) */
  startDate?: string;
  /** 외부에서 주입되는 종료일 (메인 페이지 연동용) */
  endDate?: string;
  /** 맵(트리맵)을 숨길지 여부 (메인 페이지용) */
  hideMap?: boolean;
}

/**
 * 테스트를 위한 더미 데이터 생성기 (150개, 실데이터와 동일하게 점수 내림차순 정렬)
 */
const generateDummyRankings = (count: number): StockSentimentRanking[] => {
  const sectors = [
    '테크',
    '금융',
    '에너지',
    '소비재',
    '헬스케어',
    '커뮤니케이션',
    '산업재',
    '유틸리티',
    '부동산',
    '반도체',
  ];
  const names = [
    '엔트로픽',
    '오픈AI',
    '스페이스X',
    '뉴럴링크',
    '그록',
    '팔란티어',
    '데이터독',
    '스노우플레이크',
    '클라우드플레어',
    '지스케일러',
    '크라우드스트라이크',
    '유니티',
    '로블록스',
    '코인베이스',
    '마이크로스트래티지',
  ];

  const dummy = Array.from({ length: count }, (_, i) => ({
    ticker: `DUMMY-${i + 1}`,
    name_ko:
      names[i % names.length] + (i >= names.length ? ` ${Math.floor(i / names.length)}` : ''),
    sector: sectors[Math.floor(Math.random() * sectors.length)],
    total_score: Math.floor(Math.random() * 301) - 150, // -150 ~ 150
    mention_count: Math.floor(Math.random() * 50) + 1,
    avg_intensity: Math.random() * 4 + 1,
  }));

  return dummy.sort((a, b) => b.total_score - a.total_score);
};

export function SentimentRadar({
  startDate: propsStartDate,
  endDate: propsEndDate,
  hideMap = false,
}: SentimentRadarProps) {
  const isExternalFilter = !!propsStartDate && !!propsEndDate;

  const [internalDate, setInternalDate] = useState<Date>(new Date());
  const [periodType, setPeriodType] = useState<PeriodType>('day');
  const [dataScale, setDataScale] = useState<DataScale>(25);

  const [selectedTicker, setSelectedTicker] = useState<{ ticker: string; name: string } | null>(
    null,
  );

  const getRange = (baseDate: Date, type: PeriodType) => {
    switch (type) {
      case 'day':
        return { start: startOfDay(baseDate), end: endOfDay(baseDate) };
      case 'week':
        return { start: startOfWeek(baseDate), end: endOfWeek(baseDate) };
      case 'month':
        return { start: startOfMonth(baseDate), end: endOfMonth(baseDate) };
      case 'year':
        return { start: startOfYear(baseDate), end: endOfYear(baseDate) };
    }
  };

  const internalRange = getRange(internalDate, periodType);
  const finalStart = propsStartDate || internalRange.start.toISOString();
  const finalEnd = propsEndDate || internalRange.end.toISOString();

  const { data: ranking, isLoading } = useQuery({
    queryKey: ['stock-sentiment-ranking', finalStart, finalEnd],
    queryFn: () => getStockSentimentRanking(finalStart, finalEnd),
  });

  // 실데이터 정렬 버전
  const realRankings = useMemo(() => {
    return (ranking || []).sort((a, b) => b.total_score - a.total_score);
  }, [ranking]);

  // 1. TOP 5 데이터 (엄격하게 실데이터만 사용)
  const bullishTop5 = realRankings.filter((item) => item.total_score > 0).slice(0, 5);
  const bearishTop5 = [...realRankings]
    .sort((a, b) => a.total_score - b.total_score)
    .filter((item) => item.total_score < 0)
    .slice(0, 5);

  // 2. 트리맵 데이터 (상승 상위 N개 + 하락 하위 N개 추출)
  const mapData = useMemo(() => {
    if (dataScale === 150) {
      const dummyData = generateDummyRankings(150);
      return [...realRankings, ...dummyData].sort((a, b) => b.total_score - a.total_score);
    }

    if (dataScale === 0) return realRankings;

    // 상승 상위 N개 추출
    const bulls = realRankings.filter((item) => item.total_score > 0).slice(0, dataScale);

    // 하락 하위 N개 추출 (오름차순 정렬 후 추출)
    const bears = [...realRankings]
      .filter((item) => item.total_score < 0)
      .sort((a, b) => a.total_score - b.total_score)
      .slice(0, dataScale);

    // 두 그룹 합친 후 내림차순 최종 정렬
    return [...bulls, ...bears].sort((a, b) => b.total_score - a.total_score);
  }, [realRankings, dataScale]);

  const totalMarketScore =
    realRankings.reduce((acc, curr) => acc + (Number(curr.total_score) || 0), 0) || 0;
  const mood = getMarketMood(totalMarketScore);

  const moveDate = (amount: number) => {
    if (isExternalFilter) return;
    const newDate = new Date(internalDate);
    if (periodType === 'day') newDate.setDate(internalDate.getDate() + amount);
    if (periodType === 'week') newDate.setDate(internalDate.getDate() + amount * 7);
    if (periodType === 'month') newDate.setMonth(internalDate.getMonth() + amount);
    if (periodType === 'year') newDate.setFullYear(internalDate.getFullYear() + amount);
    setInternalDate(newDate);
  };

  if (isLoading) return <SentimentRadarSkeleton />;

  return (
    <div className='space-y-10 mb-8'>
      {/* 1. 헤더 */}
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
        <div className='flex items-center gap-2'>
          <Target className='w-5 h-5 text-primary' />
          <h2 className='text-lg font-bold tracking-tight'>센티먼트 레이더</h2>
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
              <Button
                variant='ghost'
                size='sm'
                className='h-7 px-2 text-[11px] font-bold text-muted-foreground hover:text-primary'
                onClick={() => {
                  setInternalDate(new Date());
                  setPeriodType('day');
                }}
              >
                오늘
              </Button>
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

      {/* 2. TOP 5 섹션 */}
      <div className='space-y-8'>
        <div className='space-y-3'>
          <div className='flex items-center gap-2 px-1'>
            <TrendingUp className='w-4 h-4 text-emerald-500' />
            <h3 className='text-sm font-bold text-emerald-500 uppercase tracking-wider'>
              급상승 TOP 5
            </h3>
          </div>
          <div className='grid grid-cols-1 sm:grid-cols-5 gap-3'>
            {bullishTop5.length > 0 ? (
              bullishTop5.map((item) => (
                <SentimentItemCard key={item.ticker} item={item} onSelect={setSelectedTicker} />
              ))
            ) : (
              <div className='col-span-full h-24 flex items-center justify-center border border-dashed border-border/40 rounded-xl bg-muted/5'>
                <p className='text-xs font-medium text-muted-foreground'>상승 종목이 없습니다.</p>
              </div>
            )}
          </div>
        </div>
        <div className='space-y-3'>
          <div className='flex items-center gap-2 px-1'>
            <TrendingDown className='w-4 h-4 text-rose-500' />
            <h3 className='text-sm font-bold text-rose-500 uppercase tracking-wider'>
              급하락 TOP 5
            </h3>
          </div>
          <div className='grid grid-cols-1 sm:grid-cols-5 gap-3'>
            {bearishTop5.length > 0 ? (
              bearishTop5.map((item) => (
                <SentimentItemCard key={item.ticker} item={item} onSelect={setSelectedTicker} />
              ))
            ) : (
              <div className='col-span-full h-24 flex items-center justify-center border border-dashed border-border/40 rounded-xl bg-muted/5'>
                <p className='text-xs font-medium text-muted-foreground'>하락 종목이 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. 전체 시장 맵 */}
      {!hideMap && (
        <div className='space-y-4'>
          <div className='flex items-center justify-between px-1'>
            <div className='flex items-center gap-2'>
              <Maximize2 className='w-4 h-4 text-muted-foreground' />
              <h3 className='text-sm font-bold text-muted-foreground uppercase tracking-wider'>
                시장 센티먼트 맵
              </h3>
            </div>

            <div className='flex items-center gap-1.5 bg-muted/50 p-1 rounded-lg border border-border/50'>
              <span className='text-[10px] font-bold text-muted-foreground px-2 me-1'>스케일</span>
              {([10, 25, 150, 0] as DataScale[]).map((s) => (
                <Button
                  key={s}
                  variant='ghost'
                  size='sm'
                  onClick={() => setDataScale(s)}
                  className={cn(
                    'h-6 px-3 text-[10px] font-black transition-all',
                    dataScale === s
                      ? 'bg-background shadow-sm text-primary'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {s === 0 ? '전체' : s === 150 ? 'Test 150' : `Top ${s}`}
                </Button>
              ))}
            </div>
          </div>

          <Card className='h-[600px] border-border/40 bg-black overflow-hidden'>
            <SentimentMarketMap data={mapData} onSelect={setSelectedTicker} />
          </Card>
        </div>
      )}

      <SentimentDetailDialog
        selectedTicker={selectedTicker}
        onClose={() => setSelectedTicker(null)}
        range={{ start: new Date(finalStart), end: new Date(finalEnd) }}
      />
    </div>
  );
}

const getMarketMood = (score: number) => {
  if (score > 20) return { label: '매우 낙관', color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
  if (score > 5) return { label: '낙관', color: 'text-emerald-400', bg: 'bg-emerald-400/10' };
  if (score < -20) return { label: '매우 공포', color: 'text-rose-500', bg: 'bg-rose-500/10' };
  if (score < -5) return { label: '공포', color: 'text-rose-400', bg: 'bg-rose-400/10' };
  return { label: '중립', color: 'text-slate-400', bg: 'bg-slate-400/10' };
};
