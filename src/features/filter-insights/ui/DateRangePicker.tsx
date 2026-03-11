/**
 * 사용자가 특정 기간을 선택할 수 있는 캘린더 기반의 기간 선택 컴포넌트입니다.
 */
'use client';

import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import * as React from 'react';
import type { DateRange } from 'react-day-picker';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Calendar } from '@/shared/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';

/** 기간 선택 컴포넌트의 Props 인터페이스 */
interface DateRangePickerProps {
  /** 컴포넌트 추가 클래스명 */
  className?: string;
  /** 현재 선택된 기간 값 */
  value: DateRange | undefined;
  /** 기간 변경 시 호출되는 핸들러 */
  onChange: (range: DateRange | undefined) => void;
}

/**
 * Popover 형태로 제공되는 기간 선택(Date Range) 컴포넌트입니다.
 * @param {DateRangePickerProps} props 컴포넌트 Props
 * @returns {JSX.Element} 기간 선택 UI
 */
export function DateRangePicker({ className, value, onChange }: DateRangePickerProps) {
  return (
    <div className={cn('grid gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id='date'
            variant={'outline'}
            className={cn(
              'w-[260px] justify-start text-left font-normal',
              !value && 'text-muted-foreground',
            )}
          >
            <CalendarIcon className='mr-2 h-4 w-4' />
            {value?.from ? (
              value.to ? (
                <>
                  {format(value.from, 'LLL dd, y', { locale: ko })} -{' '}
                  {format(value.to, 'LLL dd, y', { locale: ko })}
                </>
              ) : (
                format(value.from, 'LLL dd, y', { locale: ko })
              )
            ) : (
              <span>기간 선택</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-auto p-0' align='start'>
          <Calendar
            initialFocus
            mode='range'
            defaultMonth={value?.from}
            selected={value}
            onSelect={onChange}
            numberOfMonths={2}
            locale={ko}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
