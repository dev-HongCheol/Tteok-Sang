/**
 * 연도 선택 전용 피커 컴포넌트입니다.
 */
'use client';

import { Button } from '@/shared/ui/button';

interface YearPickerProps {
  /** 현재 선택된 날짜 */
  date: Date;
  /** 날짜 변경 핸들러 */
  onChange: (d: Date) => void;
}

export function YearPicker({ date, onChange }: YearPickerProps) {
  const currentYear = date.getFullYear();
  const years = Array.from({ length: 12 }, (_, i) => currentYear - 5 + i);

  return (
    <div className='p-3 w-64'>
      <div className='grid grid-cols-3 gap-2'>
        {years.map((y) => (
          <Button
            key={y}
            variant={currentYear === y ? 'default' : 'ghost'}
            className='h-12 text-xs font-bold'
            onClick={() => {
              const newDate = new Date(date);
              newDate.setFullYear(y);
              onChange(newDate);
            }}
          >
            {y}년
          </Button>
        ))}
      </div>
    </div>
  );
}
