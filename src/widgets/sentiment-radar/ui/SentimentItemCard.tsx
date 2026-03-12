/**
 * 센티먼트 레이더에서 사용되는 개별 종목 카드 컴포넌트입니다.
 */
'use client';

import { MessageSquare, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Card, CardContent } from '@/shared/ui/card';

interface SentimentItemCardProps {
  /** 종목 데이터 */
  item: any;
  /** 클릭 시 호출될 핸들러 */
  onSelect: (val: { ticker: string; name: string }) => void;
}

export function SentimentItemCard({ item, onSelect }: SentimentItemCardProps) {
  return (
    <Card
      onClick={() => onSelect({ ticker: item.ticker, name: item.name_ko })}
      className='overflow-hidden border-border/40 bg-card/30 backdrop-blur-sm hover:bg-card/50 transition-all cursor-pointer hover:scale-[1.03] active:scale-[0.97] duration-200 group/card'
    >
      <CardContent className='p-4 space-y-3'>
        <div className='flex items-start justify-between'>
          <div className='space-y-0.5'>
            <p className='text-[10px] font-medium text-muted-foreground uppercase tracking-wider'>
              {item.ticker}
            </p>
            <h3 className='font-bold text-sm truncate max-w-[100px] group-hover/card:text-primary transition-colors'>
              {item.name_ko}
            </h3>
          </div>
          <div
            className={cn(
              'p-1.5 rounded-lg transition-transform group-hover/card:rotate-12',
              item.total_score > 0
                ? 'bg-emerald-500/10 text-emerald-500'
                : item.total_score < 0
                  ? 'bg-rose-500/10 text-rose-500'
                  : 'bg-slate-500/10 text-slate-500',
            )}
          >
            {item.total_score > 0 ? (
              <TrendingUp className='w-4 h-4' />
            ) : item.total_score < 0 ? (
              <TrendingDown className='w-4 h-4' />
            ) : (
              <Minus className='w-4 h-4' />
            )}
          </div>
        </div>

        <div className='flex items-end justify-between'>
          <div className='space-y-1'>
            <div className='flex items-center gap-1 text-muted-foreground transition-colors'>
              <MessageSquare className='w-3 h-3' />
              <span className='text-[10px]'>{item.mention_count}개의 분석</span>
            </div>
            <div className='flex items-center gap-1.5'>
              <span
                className={cn(
                  'text-lg font-black leading-none',
                  item.total_score > 0 ? 'text-emerald-500' : item.total_score < 0 ? 'text-rose-500' : 'text-slate-500',
                )}
              >
                {item.total_score > 0 ? '+' : ''}
                {item.total_score}
              </span>
              <span className='text-[10px] font-bold text-muted-foreground opacity-50'>점</span>
            </div>
          </div>
          <div className='flex flex-col items-end'>
            <span className='text-[9px] font-bold text-muted-foreground uppercase opacity-40 leading-none mb-1'>
              강도
            </span>
            <div className='flex gap-0.5'>
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={cn(
                    'w-1.5 h-3 rounded-full',
                    i <= Math.round(item.avg_intensity)
                      ? item.total_score > 0
                        ? 'bg-emerald-500'
                        : item.total_score < 0
                          ? 'bg-rose-500'
                          : 'bg-slate-500'
                      : 'bg-muted',
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
