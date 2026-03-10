'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  triggerAnalysisOnlyAction,
  triggerPipelineAction,
} from '@/features/sync-pipeline/api/actions';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export function SystemSettings() {
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  // 1. 전체 파이프라인 수동 실행 (수집 + 분석)
  const handleFullRun = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    toast.info('전체 파이프라인을 시작합니다...');

    try {
      const result = await triggerPipelineAction();
      if (result.success) {
        toast.success('전체 실행 완료');
      } else {
        toast.error('실행 실패', { description: result.error });
      }
      queryClient.invalidateQueries({ queryKey: ['pipeline-logs'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
    } catch (error: any) {
      toast.error('네트워크 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. 미분석 피드만 단독 분석
  const handleAnalysisOnly = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    toast.info('미분석 피드 분석을 시작합니다...');

    try {
      const result = await triggerAnalysisOnlyAction();
      if (result.success) {
        if (result.count === 0) {
          toast.info('분석할 피드가 없습니다.');
        } else {
          toast.success(`${result.count}개 피드 분석 완료`);
        }
      } else {
        toast.error('분석 실패', { description: result.error });
      }
      queryClient.invalidateQueries({ queryKey: ['pipeline-logs'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
    } catch (error: any) {
      toast.error('네트워크 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className='mb-8 shadow-none border-border/50'>
      <CardHeader className='pb-3'>
        <CardTitle className='text-sm font-bold'>시스템 제어</CardTitle>
      </CardHeader>
      <CardContent className='space-y-3'>
        <div className='flex gap-3'>
          {/* 전체 실행 버튼 */}
          <Button
            variant='default'
            size='sm'
            onClick={handleFullRun}
            disabled={isProcessing}
            className='text-xs h-9'
          >
            {isProcessing ? '처리 중...' : '수동 즉시 실행 (전체)'}
          </Button>

          {/* 단독 분석 버튼 */}
          <Button
            variant='outline'
            size='sm'
            onClick={handleAnalysisOnly}
            disabled={isProcessing}
            className='text-xs h-9'
          >
            {isProcessing ? '분석 중...' : '미분석 피드 분석'}
          </Button>
        </div>

        <div className='pt-3 border-t border-border/30'>
          <p className='text-sm text-muted-foreground flex justify-between'>
            <span>자동 수집 주기</span>
            <span className='font-bold text-foreground'>매 시간 정각</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
