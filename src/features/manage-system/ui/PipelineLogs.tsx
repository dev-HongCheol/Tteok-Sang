'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase/client';
import type { PipelineLog } from '@/entities/system/model/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

export function PipelineLogs() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['pipeline-logs'],
    queryFn: async (): Promise<PipelineLog[]> => {
      const { data, error } = await supabase
        .from('ts_pipeline_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000, // 1분마다 자동 갱신
  });

  if (isLoading) return <Loader2 className="h-6 w-6 animate-spin mx-auto" />;

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="text-lg">최근 실행 로그</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>시작 시간</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className="text-right">수집/분석</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs?.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-xs font-mono">
                  {format(new Date(log.started_at), 'MM-dd HH:mm:ss')}
                </TableCell>
                <TableCell>
                  {log.status === 'success' ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">성공</Badge>
                  ) : log.status === 'error' ? (
                    <Badge variant="destructive">실패</Badge>
                  ) : (
                    <Badge variant="secondary">진행중</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right text-xs">
                  {log.collected_count} / {log.analyzed_count}
                </TableCell>
              </TableRow>
            ))}
            {(!logs || logs.length === 0) && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                  기록된 로그가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
