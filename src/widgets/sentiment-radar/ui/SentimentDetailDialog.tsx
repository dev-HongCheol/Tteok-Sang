/**
 * 특정 종목의 상세 인사이트 분석 리스트를 보여주는 다이얼로그 컴포넌트입니다.
 */
'use client';

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, ExternalLink, Loader2, MessageSquare } from 'lucide-react';
import { useMemo, useState } from 'react';
import { getInsightsByTicker } from '@/entities/insight/api/insight';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { ScrollArea } from '@/shared/ui/scroll-area';

interface SentimentDetailDialogProps {
  /** 선택된 티커 정보 (없으면 닫힘) */
  selectedTicker: { ticker: string; name: string } | null;
  /** 다이얼로그 닫기 핸들러 */
  onClose: () => void;
  /** 조회 기간 범위 */
  range: { start: Date; end: Date };
}

const ITEMS_PER_PAGE = 10;

/**
 * 종목 상세 분석 다이얼로그 컴포넌트
 */
export function SentimentDetailDialog({
  selectedTicker,
  onClose,
  range,
}: SentimentDetailDialogProps) {
  const [page, setPage] = useState(1);

  // 특정 종목 상세 조회 (데이터 누락 방지를 위해 충분한 양인 100개 조회)
  const { data: details, isLoading: isDetailsLoading } = useQuery({
    queryKey: [
      'stock-details',
      selectedTicker?.ticker,
      selectedTicker?.name,
      range.start.toISOString(),
      range.end.toISOString(),
    ],
    queryFn: () =>
      getInsightsByTicker(
        selectedTicker!.ticker,
        selectedTicker!.name,
        range.start.toISOString(),
        range.end.toISOString(),
        100,
      ),
    enabled: !!selectedTicker,
  });

  // 페이지네이션된 데이터 계산
  const pagedDetails = useMemo(() => {
    if (!details) return [];
    const start = (page - 1) * ITEMS_PER_PAGE;
    return details.slice(start, start + ITEMS_PER_PAGE);
  }, [details, page]);

  const totalPages = Math.ceil((details?.length || 0) / ITEMS_PER_PAGE);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setPage(1); // 닫힐 때 페이지 초기화
    }
  };

  return (
    <Dialog open={!!selectedTicker} onOpenChange={handleOpenChange}>
      <DialogContent className='max-w-[900px]! flex flex-col p-0 overflow-hidden border-border/40 bg-card/95 backdrop-blur-xl'>
        <DialogHeader className='px-6 pt-6 pb-2 border-b border-border/50 shrink-0'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Badge variant='outline' className='text-[10px] uppercase tracking-widest opacity-60'>
                {selectedTicker?.ticker}
              </Badge>
              <div className='w-1 h-1 rounded-full bg-muted-foreground/30' />
              <span className='text-[10px] font-bold text-muted-foreground'>
                총 {details?.length || 0}개의 분석 중 {(page - 1) * ITEMS_PER_PAGE + 1}-
                {Math.min(page * ITEMS_PER_PAGE, details?.length || 0)}번째
              </span>
            </div>

            {/* 모달 상단 페이지네이션 컨트롤 */}
            {totalPages > 1 && (
              <div className='flex items-center gap-2 bg-muted/50 rounded-lg p-0.5 border border-border/50 me-5'>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-6 w-6'
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className='h-3 w-3' />
                </Button>
                <span className='text-[10px] font-mono font-bold px-1 min-w-[3rem] text-center'>
                  {page} / {totalPages}
                </span>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-6 w-6'
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className='h-3 w-3' />
                </Button>
              </div>
            )}
          </div>
          <DialogTitle className='text-2xl font-black flex items-center gap-2 mt-1'>
            {selectedTicker?.name}{' '}
            <span className='text-muted-foreground/40 font-light'>인사이트 분석</span>
          </DialogTitle>
        </DialogHeader>

        {/* 스크롤 가능한 상세 분석 리스트 (높이 500px 고정) */}
        <div className='relative shrink-0'>
          <ScrollArea className='h-[500px]'>
            <div className='p-6 space-y-4'>
              {isDetailsLoading ? (
                <div className='flex flex-col items-center justify-center py-20 space-y-4'>
                  <Loader2 className='w-8 h-8 animate-spin text-primary' />
                  <p className='text-sm font-bold text-muted-foreground animate-pulse'>
                    인사이트를 불러오는 중...
                  </p>
                </div>
              ) : pagedDetails && pagedDetails.length > 0 ? (
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {pagedDetails.map((insight) => (
                    <Card
                      key={insight.id}
                      className='bg-background/50 border-border/40 hover:border-primary/30 transition-all group'
                    >
                      <CardContent className='px-4'>
                        {/* 섹터 뱃지 + 원문 링크 */}
                        <div className='flex items-center justify-between mb-2'>
                          <div className='flex gap-1'>
                            {insight.sectors?.slice(0, 2).map((s) => (
                              <Badge
                                key={s}
                                variant='outline'
                                className='text-[9px] h-4 px-1 opacity-60'
                              >
                                {s}
                              </Badge>
                            ))}
                          </div>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='h-6 px-1.5 text-[10px] gap-1 opacity-0 group-hover:opacity-100 transition-opacity'
                            asChild
                          >
                            <a
                              href={`https://twitter.com/x/status/${insight.ts_feeds.tweet_id}`}
                              target='_blank'
                              rel='noreferrer'
                            >
                              원문 보기 <ExternalLink className='w-3 h-3' />
                            </a>
                          </Button>
                        </div>
                        <div className='flex items-start justify-between mb-0.5'>
                          <div className='flex items-center gap-2'>
                            <span className='text-xs font-bold'>
                              {insight.ts_feeds.ts_experts.name}
                            </span>
                            <span className='text-[10px] text-muted-foreground opacity-60'>
                              {format(new Date(insight.ts_feeds.published_at), 'MM월 dd일 HH:mm')}
                            </span>
                          </div>
                          <Badge
                            variant={
                              insight.sentiment_direction === 'Bullish'
                                ? 'default'
                                : insight.sentiment_direction === 'Bearish'
                                  ? 'destructive'
                                  : 'secondary'
                            }
                            className={cn(
                              'text-[9px] h-5 px-1.5 font-bold uppercase tracking-tighter',
                              insight.sentiment_direction === 'Bullish' &&
                                'bg-emerald-500/10 text-emerald-500',
                            )}
                          >
                            {insight.sentiment_direction === 'Bullish'
                              ? '강세'
                              : insight.sentiment_direction === 'Bearish'
                                ? '약세'
                                : '중립'}
                          </Badge>
                        </div>
                        <p className='text-sm leading-relaxed mb-3 group-hover:text-foreground transition-colors'>
                          {insight.summary_line || '요약 정보가 없습니다.'}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className='flex flex-col items-center justify-center py-20 text-muted-foreground opacity-40'>
                  <MessageSquare className='w-12 h-12 mb-2' />
                  <p className='font-bold'>데이터가 존재하지 않습니다.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <div className='h-4 shrink-0' />
      </DialogContent>
    </Dialog>
  );
}
