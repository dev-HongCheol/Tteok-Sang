'use client';

import { Input } from '@/shared/ui/input';
import { Search, X } from 'lucide-react';
import { ExpertMultiSelect } from './ExpertMultiSelect';
import { DateRangePicker } from './DateRangePicker';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Label } from '@/shared/ui/label';

interface FeedFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedExpertIds: string[] | undefined; // 타입 업데이트
  onExpertsChange: (ids: string[] | undefined) => void;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
}

const CATEGORIES = [
  '거시경제', '반도체', '2차전지', '인공지능', 
  '바이오', '자동차', '에너지', '로봇', '코인', '부동산', '기타'
];

export function FeedFilter({
  searchQuery,
  onSearchChange,
  selectedExpertIds,
  onExpertsChange,
  dateRange,
  onDateRangeChange,
  selectedCategories,
  onCategoriesChange,
}: FeedFilterProps) {
  
  const toggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      onCategoriesChange(selectedCategories.filter((c) => c !== cat));
    } else {
      onCategoriesChange([...selectedCategories, cat]);
    }
  };

  const clearFilters = () => {
    onSearchChange('');
    onExpertsChange(undefined); // 초기 상태로 리셋
    onDateRangeChange(undefined);
    onCategoriesChange([]);
  };

  const hasActiveFilters = searchQuery || selectedExpertIds !== undefined || dateRange || selectedCategories.length > 0;

  return (
    <div className="space-y-6 bg-card/30 p-6 rounded-xl border border-border/50 backdrop-blur-md sticky top-4">
      {/* 검색어 입력 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="인사이트 검색..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 bg-background/50"
        />
      </div>

      {/* 카테고리 필터 */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">테마 카테고리 (다중 선택 가능)</Label>
        <div className="flex flex-wrap gap-1.5">
          <Badge
            variant={selectedCategories.length === 0 ? 'default' : 'outline'}
            className="cursor-pointer px-2.5 py-0.5 text-[11px]"
            onClick={() => onCategoriesChange([])}
          >
            전체
          </Badge>
          {CATEGORIES.map((cat) => (
            <Badge
              key={cat}
              variant={selectedCategories.includes(cat) ? 'default' : 'outline'}
              className="cursor-pointer px-2.5 py-0.5 text-[11px]"
              onClick={() => toggleCategory(cat)}
            >
              {cat}
            </Badge>
          ))}
        </div>
      </div>

      {/* 분석 계정 필터 */}
      <ExpertMultiSelect selectedExpertIds={selectedExpertIds} onChange={onExpertsChange} />

      {/* 기간 선택 */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">작성 기간</Label>
        <DateRangePicker value={dateRange} onChange={onDateRangeChange} />
      </div>

      {/* 필터 초기화 */}
      {hasActiveFilters && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={clearFilters}
          className="w-full text-xs text-muted-foreground hover:text-foreground gap-2"
        >
          <X className="h-3 w-3" />
          필터 모두 초기화
        </Button>
      )}
    </div>
  );
}
