'use client';

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, FileText, Info, Loader2 } from 'lucide-react';
import { useState } from 'react';
import type { PipelineLog } from '@/entities/system/model/types';
import { supabase } from '@/shared/api/supabase/client';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

const PAGE_SIZE = 10;

export function PipelineLogs() {
  const [page, setPage] = useState(0);
  const [selectedError, setSelectedError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['pipeline-logs', page],
    queryFn: async () => {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error, count } = await supabase
        .from('ts_pipeline_logs')
        .select('*', { count: 'exact' })
        .order('started_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      return { logs: data as PipelineLog[], totalCount: count || 0 };
    },
    refetchInterval: 15000,
  });

  const logs = data?.logs || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const hasNextPage = (page + 1) * PAGE_SIZE < totalCount;
  const hasPrevPage = page > 0;

  const getStatusBadge = (log: PipelineLog) => {
    let badge = <Badge variant='outline'>{log.status || '알 수 없음'}</Badge>;
    let isError = false;

    if (log.status === '완료') {
      badge = (
        <Badge variant='outline' className='text-green-500 bg-green-500/10 border-green-500/20'>
          완료
        </Badge>
      );
    } else if (log.status === '분석 오류') {
      badge = <Badge variant='destructive'>분석 오류</Badge>;
      isError = true;
    } else if (log.status === '수집 오류') {
      badge = (
        <Badge variant='outline' className='text-orange-500 bg-orange-500/10 border-orange-500/20'>
          수집 오류
        </Badge>
      );
      isError = true;
    } else if (log.status === '진행중') {
      badge = (
        <Badge variant='secondary' className='animate-pulse'>
          진행중
        </Badge>
      );
    } else if (log.status === '시스템 오류') {
      badge = <Badge variant='destructive'>시스템 오류</Badge>;
      isError = true;
    }

    if (isError && log.error_message) {
      return (
        <div className='flex items-center gap-1'>
          {badge}
          <Button
            variant='ghost'
            size='icon'
            className='w-6 h-6 text-destructive hover:text-destructive hover:bg-destructive/10'
            onClick={() => setSelectedError(log.error_message)}
          >
            <FileText className='h-3.5 w-3.5' />
          </Button>
        </div>
      );
    }

    return badge;
  };

  if (isLoading && page === 0) return <Loader2 className='w-6 h-6 mx-auto my-10 animate-spin' />;

  return (
    <>
      <Card className='mt-8 overflow-hidden shadow-none border-border/50'>
        <CardHeader className='flex flex-row items-center justify-between pb-3 border-b border-border/30 bg-muted/20'>
          <CardTitle className='flex items-center gap-2 text-sm font-bold'>
            <Info className='w-4 h-4 text-primary' />
            실행 이력
          </CardTitle>
          <span className='text-sm bg-background px-2 py-0.5 rounded-full border border-border/50 font-medium'>
            Total {totalCount}
          </span>
        </CardHeader>
        <CardContent className='p-0'>
          <Table>
            <TableHeader className='bg-muted/10'>
              <TableRow className='border-b hover:bg-transparent border-border/30'>
                <TableHead className='w-[110px] text-sm py-2 px-4'>일시</TableHead>
                <TableHead className='text-sm py-2'>상태</TableHead>
                <TableHead className='text-right text-sm py-2 px-4'>수집/분석</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow
                  key={log.id}
                  className='transition-colors border-b hover:bg-muted/30 border-border/20'
                >
                  <TableCell className='text-sm font-mono text-muted-foreground py-2 px-4'>
                    {format(new Date(log.started_at), 'MM-dd HH:mm', { locale: ko })}
                  </TableCell>
                  <TableCell className='py-2'>{getStatusBadge(log)}</TableCell>
                  <TableCell className='text-right text-sm font-bold py-2 px-4'>
                    <span className='text-orange-500'>{log.collected_count}</span>
                    <span className='mx-1 text-muted-foreground'>/</span>
                    <span className='text-emerald-500'>{log.analyzed_count}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className='flex items-center justify-between p-3 border-t bg-muted/5 border-border/30'>
            <div className='text-sm text-muted-foreground'>
              {page + 1} / {totalPages || 1} Page
            </div>
            <div className='flex gap-1'>
              <Button
                variant='ghost'
                size='icon'
                className='border h-7 w-7 border-border/20'
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={!hasPrevPage}
              >
                <ChevronLeft className='w-4 h-4' />
              </Button>
              <Button
                variant='ghost'
                size='icon'
                className='border h-7 w-7 border-border/20'
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasNextPage}
              >
                <ChevronRight className='w-4 h-4' />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedError} onOpenChange={(open) => !open && setSelectedError(null)}>
        <DialogContent className='max-w-7xl! w-[80%] h-[600px] flex flex-col p-0'>
          <DialogHeader className='p-6 pb-2 border-b'>
            <DialogTitle className='flex items-center gap-2 text-destructive'>
              <FileText className='w-5 h-5' />
              상세 에러 로그
            </DialogTitle>
          </DialogHeader>

          <div className='flex-1 min-h-0'>
            <ScrollArea className='w-full h-full p-6'>
              <div className='p-4 border rounded-lg bg-muted/50 border-border/50'>
                <pre className='text-sm font-mono whitespace-pre-wrap break-all leading-relaxed text-foreground/80'>
                  {selectedError}
                </pre>
              </div>
            </ScrollArea>
          </div>

          <div className='flex justify-end p-4 border-t bg-muted/20'>
            <Button variant='outline' size='sm' onClick={() => setSelectedError(null)}>
              닫기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
