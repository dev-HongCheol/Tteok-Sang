/**
 * 월 선택 전용 피커 컴포넌트입니다.
 */
'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/shared/ui/button';

interface MonthPickerProps {
  /** 현재 선택된 날짜 */
  date: Date;
  /** 날짜 변경 핸들러 */
  onChange: (d: Date) => void;
}

export function MonthPicker({ date, onChange }: MonthPickerProps) {
  const currentYear = date.getFullYear();
  const months = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ];

  return (
    <div className='p-3 w-64 space-y-4'>
      <div className='flex items-center justify-between px-1'>
        <Button 
          variant='ghost' size='icon' className='h-7 w-7' 
          onClick={() => {
            const d = new Date(date);
            d.setFullYear(currentYear - 1);
            onChange(d);
          }}
        >
          <ChevronLeft className='h-4 w-4' />
        </Button>
        <span className='text-sm font-bold'>{currentYear}년</span>
        <Button 
          variant='ghost' size='icon' className='h-7 w-7' 
          onClick={() => {
            const d = new Date(date);
            d.setFullYear(currentYear + 1);
            onChange(d);
          }}
        >
          <ChevronRight className='h-4 w-4' />
        </Button>
      </div>
      <div className='grid grid-cols-3 gap-2'>
        {months.map((m, i) => (
          <Button
            key={m}
            variant={date.getMonth() === i ? 'default' : 'ghost'}
            className='h-9 text-xs font-medium'
            onClick={() => {
              const newDate = new Date(date);
              newDate.setMonth(i);
              onChange(newDate);
            }}
          >
            {m}
          </Button>
        ))}
      </div>
    </div>
  );
}
