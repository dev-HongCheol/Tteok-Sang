'use client';

import { useQuery } from '@tanstack/react-query';
import { getExperts } from '@/entities/expert/api/expert';
import { Checkbox } from '@/shared/ui/checkbox';
import { Label } from '@/shared/ui/label';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '@/shared/ui/scroll-area';

interface ExpertMultiSelectProps {
  selectedExpertIds: string[] | undefined;
  onChange: (ids: string[] | undefined) => void;
}

export function ExpertMultiSelect({
  selectedExpertIds,
  onChange,
}: ExpertMultiSelectProps) {
  const { data: experts, isLoading } = useQuery({
    queryKey: ['experts'],
    queryFn: getExperts,
  });

  const allIds = experts?.map((e) => e.id) || [];
  
  // 시각적으로 모든 계정이 체크된 상태인지 확인
  const isAllChecked = selectedExpertIds === undefined || (allIds.length > 0 && selectedExpertIds.length === allIds.length);

  // 현재 선택된 계정의 실제 개수 계산
  const selectedCount = selectedExpertIds === undefined ? allIds.length : selectedExpertIds.length;

  const handleToggleAll = () => {
    if (isAllChecked) {
      onChange([]); // 모두 해제
    } else {
      onChange(undefined); // 모두 선택 (초기 상태로 리셋)
    }
  };

  const toggleExpert = (id: string) => {
    if (selectedExpertIds === undefined) {
      onChange(allIds.filter(itemId => itemId !== id));
      return;
    }

    if (selectedExpertIds.includes(id)) {
      onChange(selectedExpertIds.filter((itemId) => itemId !== id));
    } else {
      const next = [...selectedExpertIds, id];
      if (next.length === allIds.length) {
        onChange(undefined);
      } else {
        onChange(next);
      }
    }
  };

  if (isLoading) return <Loader2 className="h-4 w-4 animate-spin" />;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <Label className="text-sm font-semibold">분석 계정</Label>
        <button 
          type="button"
          onClick={handleToggleAll}
          className="text-[10px] text-primary hover:underline font-bold"
        >
          전체 선택
        </button>
      </div>
      
      <ScrollArea className="h-[300px] w-full rounded-md border border-border/50 p-2 bg-background/50">
        <div className="grid grid-cols-1 gap-1">
          {experts?.map((expert) => {
            const isChecked = selectedExpertIds === undefined || selectedExpertIds.includes(expert.id);
            
            return (
              <div 
                key={expert.id} 
                className="flex items-center space-x-3 group cursor-pointer hover:bg-muted/80 p-2 rounded-md transition-all border border-transparent hover:border-border/50"
                onClick={() => toggleExpert(expert.id)}
              >
                <Checkbox
                  id={`expert-${expert.id}`}
                  checked={isChecked}
                  onCheckedChange={() => {}} 
                  className="pointer-events-none"
                />
                <div className="flex flex-col flex-1 overflow-hidden pointer-events-none">
                  <span className="text-xs font-bold truncate">@{expert.twitter_handle}</span>
                  <span className="text-[10px] text-muted-foreground truncate">{expert.name}</span>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
      
      {/* 항상 노출되는 선택 계정 수 표시 */}
      <p className="text-[10px] text-muted-foreground italic text-right">
        {selectedCount}개 계정 선택됨
      </p>
    </div>
  );
}
