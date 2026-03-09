'use client';

import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { AlertCircle, ExternalLink, Twitter } from 'lucide-react';
import type { InsightWithDetails } from '@/entities/insight/api/insight';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader } from '@/shared/ui/card';

interface InsightCardProps {
  insight: InsightWithDetails;
}

export function InsightCard({ insight }: InsightCardProps) {
  const { summary, relevance_score, importance, category, ts_feeds } = insight;
  const { ts_experts, published_at, tweet_id } = ts_feeds;

  // 중요도별 스타일 설정
  const importanceStyles = {
    High: 'bg-red-500/10 text-red-500 border-red-500/20',
    Medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    Low: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  };

  const handleOpenOriginal = () => {
    window.open(`https://x.com/${ts_experts.twitter_handle}/status/${tweet_id}`, '_blank');
  };

  return (
    <Card className='overflow-hidden hover:border-primary/50 transition-colors bg-card/50 backdrop-blur-sm'>
      <CardHeader className='p-4 pb-2'>
        <div className='flex justify-between items-start'>
          <div className='flex items-center gap-2'>
            <Badge variant='outline' className='font-medium bg-muted'>
              {category || '기타'}
            </Badge>
            {importance && (
              <Badge className={importanceStyles[importance as keyof typeof importanceStyles]}>
                {importance === 'High' && <AlertCircle className='w-3 h-3 mr-1' />}
                {importance}
              </Badge>
            )}
          </div>
          <span className='text-xs text-muted-foreground'>
            {formatDistanceToNow(new Date(published_at), { addSuffix: true, locale: ko })}
          </span>
        </div>
      </CardHeader>

      <CardContent className='p-4 pt-0'>
        <div className='flex items-center gap-2 mb-3'>
          <div className='w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center'>
            <Twitter className='w-4 h-4 text-primary' />
          </div>
          <div>
            <p className='text-sm font-semibold leading-none'>{ts_experts.name}</p>
            <p className='text-xs text-muted-foreground mt-1'>@{ts_experts.twitter_handle}</p>
          </div>
        </div>

        <div className='space-y-2'>
          {summary ? (
            <p className='text-sm leading-relaxed whitespace-pre-wrap text-foreground/90'>
              {summary}
            </p>
          ) : (
            <p className='text-sm italic text-muted-foreground'>분석된 요약 내용이 없습니다.</p>
          )}
        </div>

        <div className='mt-4 flex justify-between items-center'>
          <div className='flex items-center gap-1 text-xs text-muted-foreground'>
            <span>관련성</span>
            <span className='font-bold text-primary'>{relevance_score}%</span>
          </div>
          <Button
            variant='ghost'
            size='sm'
            onClick={handleOpenOriginal}
            className='h-8 gap-1 text-xs'
          >
            <ExternalLink className='w-3 h-3' />
            원본 보기
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
