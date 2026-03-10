'use client';

import { Search, X } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import type { MarketType } from '@/entities/insight/model/types';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { DateRangePicker } from './DateRangePicker';
import { ExpertMultiSelect } from './ExpertMultiSelect';

interface FeedFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedExpertIds: string[] | undefined;
  onExpertsChange: (ids: string[] | undefined) => void;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  selectedSectors: string[];
  onSectorsChange: (sectors: string[]) => void;
  selectedImportances: string[];
  onImportancesChange: (importances: string[]) => void;
  selectedMarkets: MarketType[];
  onMarketsChange: (markets: MarketType[]) => void;
}

/** PRD 정의 섹터 리스트 */
const SECTORS = [
  '거시경제',
  '정책/정치',
  '인공지능',
  '반도체',
  '2차전지',
  '빅테크',
  '자동차',
  '에너지/원자재',
  '로봇',
  '바이오',
  '증권/금융',
  '소비재/유통',
  '부동산',
  '코인',
  '공시/실적',
  '방산',
  '조선',
  '기타(분류외)',
];

const IMPORTANCES = ['Low', 'Medium', 'High'];
const MARKETS: MarketType[] = ['KR', 'US', 'Global'];

/**
 * 고도화된 인사이트 필터링 컴포넌트
 */
export function FeedFilter({
  searchQuery,
  onSearchChange,
  selectedExpertIds,
  onExpertsChange,
  dateRange,
  onDateRangeChange,
  selectedSectors,
  onSectorsChange,
  selectedImportances,
  onImportancesChange,
  selectedMarkets,
  onMarketsChange,
}: FeedFilterProps) {
  const toggleSector = (sector: string) => {
    if (selectedSectors.includes(sector)) {
      onSectorsChange(selectedSectors.filter((s) => s !== sector));
    } else {
      onSectorsChange([...selectedSectors, sector]);
    }
  };

  const toggleImportance = (imp: string) => {
    if (selectedImportances.includes(imp)) {
      onImportancesChange(selectedImportances.filter((i) => i !== imp));
    } else {
      onImportancesChange([...selectedImportances, imp]);
    }
  };

  const toggleMarket = (market: MarketType) => {
    if (selectedMarkets.includes(market)) {
      onMarketsChange(selectedMarkets.filter((m) => m !== market));
    } else {
      onMarketsChange([...selectedMarkets, market]);
    }
  };

  const clearFilters = () => {
    onSearchChange('');
    onExpertsChange(undefined);
    onDateRangeChange(undefined);
    onSectorsChange([]);
    onImportancesChange(['High', 'Medium']); // 기본값 설정
    onMarketsChange([]);
  };

  const hasActiveFilters =
    searchQuery ||
    selectedExpertIds !== undefined ||
    dateRange ||
    selectedSectors.length > 0 ||
    selectedMarkets.length > 0 ||
    selectedImportances.length < 3;

  return (
    <div className='sticky p-6 space-y-6 border bg-card/40 rounded-xl border-border/50 backdrop-blur-md top-4'>
      {/* 1. 시장 분류 필터 */}
      <div className='space-y-3'>
        <Label className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
          Market
        </Label>
        <div className='flex flex-wrap gap-1.5'>
          <Badge
            variant={selectedMarkets.length === 0 ? 'default' : 'outline'}
            className='cursor-pointer px-2.5 py-0.5 text-sm font-bold'
            onClick={() => onMarketsChange([])}
          >
            전체
          </Badge>
          {MARKETS.map((market) => (
            <Badge
              key={market}
              variant={selectedMarkets.includes(market) ? 'default' : 'outline'}
              className={cn(
                'cursor-pointer px-2.5 py-0.5 text-sm font-bold transition-all',
                selectedMarkets.includes(market)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-transparent',
              )}
              onClick={() => toggleMarket(market)}
            >
              {market === 'KR' ? '🇰🇷 국장' : market === 'US' ? '🇺🇸 미장' : '🌐 Global'}
            </Badge>
          ))}
        </div>
      </div>

      {/* 2. 중요도 필터 */}
      <div className='space-y-3'>
        <Label className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
          Importance
        </Label>
        <div className='flex flex-wrap gap-1.5'>
          {IMPORTANCES.map((imp) => (
            <Badge
              key={imp}
              variant={selectedImportances.includes(imp) ? 'default' : 'outline'}
              className={cn(
                'cursor-pointer px-2.5 py-0.5 text-sm font-bold',
                selectedImportances.includes(imp)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-transparent',
              )}
              onClick={() => toggleImportance(imp)}
            >
              {imp}
            </Badge>
          ))}
        </div>
      </div>

      {/* 3. 검색어 입력 */}
      <div className='relative'>
        <Search className='absolute w-4 h-4 -translate-y-1/2 left-3 top-1/2 text-muted-foreground' />
        <Input
          placeholder='종목 또는 핵심 내용 검색...'
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className='pl-9 bg-background/50 text-sm h-9 border-border/40 focus:border-primary/50'
        />
      </div>

      {/* 4. 섹터 필터 */}
      <div className='space-y-3'>
        <Label className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
          Sectors
        </Label>
        <div className='flex flex-wrap gap-1.5'>
          <Badge
            variant={selectedSectors.length === 0 ? 'default' : 'outline'}
            className='cursor-pointer px-2.5 py-0.5 text-sm font-bold'
            onClick={() => onSectorsChange([])}
          >
            전체
          </Badge>
          {SECTORS.map((sector) => (
            <Badge
              key={sector}
              variant={selectedSectors.includes(sector) ? 'default' : 'outline'}
              className={cn(
                'cursor-pointer px-2.5 py-0.5 text-sm font-medium transition-all',
                selectedSectors.includes(sector)
                  ? 'bg-primary/20 text-primary border-primary/30'
                  : 'bg-transparent',
              )}
              onClick={() => toggleSector(sector)}
            >
              {sector}
            </Badge>
          ))}
        </div>
      </div>

      {/* 5. 분석 계정 필터 */}
      <ExpertMultiSelect selectedExpertIds={selectedExpertIds} onChange={onExpertsChange} />

      {/* 6. 기간 선택 */}
      <div className='space-y-3'>
        <Label className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
          Date Range
        </Label>
        <DateRangePicker value={dateRange} onChange={onDateRangeChange} />
      </div>

      {/* 필터 초기화 */}
      {hasActiveFilters && (
        <Button
          variant='ghost'
          size='sm'
          onClick={clearFilters}
          className='w-full gap-2 text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all'
        >
          <X className='w-3.5 h-3.5' />
          필터 모두 초기화
        </Button>
      )}
    </div>
  );
}
