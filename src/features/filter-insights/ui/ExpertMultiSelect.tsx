/**
 * 전문가(분석 계정) 목록을 다중 선택할 수 있는 필터 컴포넌트입니다.
 */
'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { getExperts } from '@/entities/expert/api/expert';
import { Checkbox } from '@/shared/ui/checkbox';
import { Label } from '@/shared/ui/label';
import { ScrollArea } from '@/shared/ui/scroll-area';

/** 전문가 다중 선택 컴포넌트의 Props 인터페이스 */
interface ExpertMultiSelectProps {
  /** 현재 선택된 전문가 ID 목록 (undefined일 경우 전체 선택 상태) */
  selectedExpertIds: string[] | undefined;
  /** 선택 변경 시 호출되는 핸들러 */
  onChange: (ids: string[] | undefined) => void;
}

/**
 * 체크박스 리스트 형태로 제공되는 전문가 다중 선택 컴포넌트입니다.
 * @param {ExpertMultiSelectProps} props 컴포넌트 Props
 * @returns {JSX.Element} 전문가 선택 리스트 UI
 */
export function ExpertMultiSelect({ selectedExpertIds, onChange }: ExpertMultiSelectProps) {
  const { data: experts, isLoading } = useQuery({
    queryKey: ['experts'],
    queryFn: getExperts,
  });

  const allIds = experts?.map((e) => e.id) || [];

  // 시각적으로 모든 계정이 체크된 상태인지 확인
  const isAllChecked =
    selectedExpertIds === undefined ||
    (allIds.length > 0 && selectedExpertIds.length === allIds.length);

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
      onChange(allIds.filter((itemId) => itemId !== id));
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

  if (isLoading) return <Loader2 className='w-4 h-4 animate-spin' />;

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <Label className='text-sm font-semibold'>분석 계정</Label>
        <button
          type='button'
          onClick={handleToggleAll}
          className='text-sm text-primary hover:underline'
        >
          전체 선택
        </button>
      </div>

      <ScrollArea className='h-[300px] w-full rounded-md border border-border/50 p-2 bg-background/50'>
        <div className='grid grid-cols-1 gap-1'>
          {experts?.map((expert) => {
            const isChecked =
              selectedExpertIds === undefined || selectedExpertIds.includes(expert.id);

            return (
              <div
                key={expert.id}
                className='flex items-center p-2 space-x-3 transition-all border border-transparent rounded-md cursor-pointer group hover:bg-muted/80 hover:border-border/50'
                onClick={() => toggleExpert(expert.id)}
              >
                <Checkbox
                  id={`expert-${expert.id}`}
                  checked={isChecked}
                  onCheckedChange={() => {}}
                  className='pointer-events-none'
                />
                <div className='flex flex-col flex-1 overflow-hidden pointer-events-none'>
                  <span className='text-sm truncate'>@{expert.twitter_handle}</span>
                  <span className='text-xs text-muted-foreground truncate'>{expert.name}</span>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* 항상 노출되는 선택 계정 수 표시 */}
      <p className='text-sm text-muted-foreground italic text-right'>
        {selectedCount}개 계정 선택됨
      </p>
    </div>
  );
}
