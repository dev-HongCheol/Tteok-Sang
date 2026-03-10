'use client';

import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronDown, ChevronUp, ExternalLink, Twitter } from 'lucide-react';
import { useState } from 'react';
import type { InsightWithDetails } from '@/entities/insight/api/insight';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader } from '@/shared/ui/card';

interface InsightCardProps {
  insight: InsightWithDetails;
}

export function InsightCard({ insight }: InsightCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { summary, relevance_score, importance, category, ts_feeds } = insight;
  const { ts_experts, published_at, tweet_id, content: rawContent } = ts_feeds;

  // 중요도별 스타일 설정
  const importanceStyles = {
    High: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-900/50',
    Medium:
      'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50',
    Low: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-950/30 dark:text-slate-400 dark:border-slate-900/50',
  };

  const handleOpenOriginal = () => {
    window.open(`https://x.com/${ts_experts.twitter_handle}/status/${tweet_id}`, '_blank');
  };

  return (
    <Card className='overflow-hidden transition-all duration-300 hover:shadow-md hover:border-primary/30 bg-card/50 backdrop-blur-sm'>
      <CardHeader className='p-4 pb-2'>
        <div className='flex items-start justify-between'>
          <div className='flex items-center gap-2'>
            <Badge
              variant='secondary'
              className='font-semibold text-[10px] uppercase tracking-wider'
            >
              {category || '기타'}
            </Badge>
            {importance && (
              <Badge
                variant='outline'
                className={cn(
                  'font-bold text-[10px]',
                  importanceStyles[importance as keyof typeof importanceStyles],
                )}
              >
                {importance}
              </Badge>
            )}
          </div>
          <span className='text-[11px] font-medium text-muted-foreground'>
            {formatDistanceToNow(new Date(published_at), { addSuffix: true, locale: ko })}
          </span>
        </div>
      </CardHeader>

      <CardContent className='p-4 pt-0'>
        {/* 전문가 정보 */}
        <div className='flex items-center gap-2 mb-4'>
          <div className='flex items-center justify-center border rounded-full w-7 h-7 bg-primary/10 border-primary/20'>
            <Twitter className='w-3.5 h-3.5 text-primary' />
          </div>
          <div className='flex flex-col'>
            <p className='text-xs font-bold leading-tight'>{ts_experts.name}</p>
            <p className='text-[10px] text-muted-foreground'>@{ts_experts.twitter_handle}</p>
          </div>
        </div>

        {/* AI 요약 (핵심 내용) */}
        <div className='mb-4'>
          {summary ? (
            <p className='text-[13px] leading-relaxed font-medium whitespace-pre-wrap text-foreground/90'>
              {summary}
            </p>
          ) : (
            <p className='text-[13px] italic text-muted-foreground'>분석된 요약 내용이 없습니다.</p>
          )}
        </div>

        {/* 원문 피드 내용 (접이식) */}
        <div className='relative group'>
          <div
            className={cn(
              'p-3 rounded-lg bg-muted/30 border border-border/40 text-[12px] leading-relaxed text-muted-foreground transition-all duration-300',
              !isExpanded && 'line-clamp-2',
            )}
          >
            <span className='font-bold text-[10px] block mb-1 text-muted-foreground/70 uppercase'>
              Original Feed
            </span>
            {rawContent}
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className='mt-1 flex items-center gap-1 text-[10px] font-bold text-primary/70 hover:text-primary transition-colors'
          >
            {isExpanded ? (
              <>
                <ChevronUp className='w-3 h-3' /> 접기
              </>
            ) : (
              <>
                <ChevronDown className='w-3 h-3' /> 원문 펼쳐보기
              </>
            )}
          </button>
        </div>

        {/* 하단 푸터 */}
        <div className='flex items-center justify-between pt-3 mt-5 border-t border-border/30 '>
          <div className='flex items-center gap-1.5'>
            <span className='text-[10px] font-bold text-muted-foreground uppercase tracking-tighter'>
              관련성
            </span>
            <div className='flex items-center gap-1'>
              <div className='w-12 h-1.5 rounded-full bg-muted overflow-hidden border-gray-300'>
                <div
                  className='h-full transition-all bg-primary'
                  style={{ width: `${relevance_score}%` }}
                />
              </div>
              <span className='text-[11px] font-black text-primary'>{relevance_score}%</span>
            </div>
          </div>
          <Button
            variant='ghost'
            size='sm'
            onClick={handleOpenOriginal}
            className='h-7 px-2 gap-1 text-[10px] font-bold hover:bg-primary/10 hover:text-primary'
          >
            <ExternalLink className='w-3 h-3' />
            X에서 보기
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
