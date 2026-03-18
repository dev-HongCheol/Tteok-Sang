/**
 * 시스템 전체 제어 및 설정 상태를 관리하는 컴포넌트입니다.
 */
'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Circle, Loader2, PlayCircle, Search, Activity, Clock } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  triggerAnalysisOnlyAction,
  triggerPipelineAction,
  updateSyncIntervalAction,
} from '@/features/sync-pipeline/api/actions';
import { supabase } from '@/shared/api/supabase/client';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { cn } from '@/shared/lib/utils';

/**
 * 수동 파이프라인 실행 버튼과 시스템 상태 정보를 제공하는 컴포넌트입니다.
 * @returns {JSX.Element} 시스템 설정 및 제어 UI
 */
export function SystemSettings() {
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeAction, setActiveAction] = useState<'full' | 'analysis' | null>(null);
  const [modalType, setModalType] = useState<'full' | 'analysis' | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [latchedStep, setLatchedStep] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);

  // 1. 현재 진행 중인 파이프라인 로그 실시간 조회
  const { data: activeLog } = useQuery({
    queryKey: ['active-pipeline-log'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ts_pipeline_logs')
        .select('*')
        .eq('status', '진행중')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    refetchInterval: isProcessing || isModalOpen ? 1000 : 5000,
  });

  // 2. 수집 주기 설정 조회
  const { data: syncInterval } = useQuery({
    queryKey: ['sync-interval-setting'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ts_settings')
        .select('value')
        .eq('key', 'sync_interval')
        .single();
      
      if (error) return '0 * * * *'; // 기본값 (1시간)
      return data.value;
    }
  });

  // 3. 마지막 동기화 시간 조회
  const { data: lastSyncTime } = useQuery({
    queryKey: ['last-sync-time'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ts_pipeline_logs')
        .select('started_at')
        .eq('status', '완료')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error || !data) return null;
      return new Date(data.started_at);
    },
    refetchInterval: 30000
  });

  // 주기 옵션 생성 (1, 2, 4, 6, 8, 10, 12시간)
  const intervalOptions = [
    { label: '1시간 (정각)', value: '0 * * * *' },
    { label: '2시간 마다', value: '0 */2 * * *' },
    { label: '4시간 마다', value: '0 */4 * * *' },
    { label: '6시간 마다', value: '0 */6 * * *' },
    { label: '8시간 마다', value: '0 */8 * * *' },
    { label: '10시간 마다', value: '0 */10 * * *' },
    { label: '12시간 마다', value: '0 */12 * * *' },
  ];

  // 주기 변경 핸들러
  const handleIntervalChange = async (newVal: string) => {
    setIsUpdating(true);
    try {
      const result = await updateSyncIntervalAction(newVal);
      if (result.success) {
        toast.success('수집 주기가 업데이트되었습니다.');
        queryClient.invalidateQueries({ queryKey: ['sync-interval-setting'] });
      } else {
        toast.error('업데이트 실패', { description: result.error });
      }
    } catch (e) {
      toast.error('오류가 발생했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };

  // 실행 중이거나 로그가 있으면 모드 자동 설정
  useEffect(() => {
    if (activeAction) {
      setModalType(activeAction);
      setIsModalOpen(true);
    } else if (activeLog && !modalType) {
      const type = activeLog.error_message?.includes('분석 준비') ? 'analysis' : 'full';
      setModalType(type);
      setIsModalOpen(true);
    }
  }, [activeAction, activeLog, modalType]);

  // 진행 단계 정의 (마스터)
  const allSteps = useMemo(() => [
    { id: 'prep', label: '시스템 준비', match: '준비' },
    { id: 'sync', label: '전문가 피드 수집', match: '수집' },
    { id: 'analyze', label: 'AI 인사이트 분석', match: '분석' },
    { id: 'done', label: '데이터 정리 및 완료', match: '완료' },
  ], []);

  // 단계 인덱스 래칭 로직
  useEffect(() => {
    if (activeLog) {
      const idx = allSteps.findIndex(step => activeLog.error_message?.includes(step.match));
      if (idx !== -1) {
        setLatchedStep(prev => Math.max(prev, idx));
      }
    }
  }, [activeLog, allSteps]);

  const handleModalClose = (open: boolean) => {
    setIsModalOpen(open);
    if (!open && !isProcessing) {
      setModalType(null);
      setLatchedStep(0);
    }
  };

  const displaySteps = useMemo(() => {
    if (modalType === 'analysis') {
      return allSteps.filter(step => step.id !== 'sync');
    }
    return allSteps;
  }, [modalType, allSteps]);

  const currentStepIndex = useMemo(() => {
    if (isProcessing) return latchedStep;
    return activeLog ? latchedStep : allSteps.length;
  }, [isProcessing, latchedStep, activeLog, allSteps.length]);

  const handleFullRun = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setLatchedStep(0);
    setActiveAction('full');
    toast.info('전체 파이프라인을 시작합니다...');

    try {
      const result = await triggerPipelineAction();
      if (result.success) {
        toast.success('전체 실행 완료');
      } else {
        toast.error('실행 실패', { description: result.error });
      }
    } catch (error: any) {
      toast.error('네트워크 오류가 발생했습니다.');
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        setActiveAction(null);
        queryClient.invalidateQueries({ queryKey: ['active-pipeline-log'] });
        queryClient.invalidateQueries({ queryKey: ['pipeline-logs'] });
        queryClient.invalidateQueries({ queryKey: ['insights'] });
        queryClient.invalidateQueries({ queryKey: ['last-sync-time'] });
      }, 1000);
    }
  };

  const handleAnalysisOnly = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setLatchedStep(0);
    setActiveAction('analysis');
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
    } catch (error: any) {
      toast.error('네트워크 오류가 발생했습니다.');
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        setActiveAction(null);
        queryClient.invalidateQueries({ queryKey: ['active-pipeline-log'] });
        queryClient.invalidateQueries({ queryKey: ['pipeline-logs'] });
        queryClient.invalidateQueries({ queryKey: ['insights'] });
        queryClient.invalidateQueries({ queryKey: ['last-sync-time'] });
      }, 1000);
    }
  };

  return (
    <>
      <Card className='mb-8 shadow-none border-border/50'>
        <CardHeader className='pb-3 border-b border-border/30 bg-muted/20'>
          <CardTitle className='text-sm font-bold flex items-center gap-2'>
            <PlayCircle className='w-4 h-4 text-primary' />
            시스템 제어
          </CardTitle>
        </CardHeader>
        <CardContent className='pt-5 space-y-4'>
          <div className='flex flex-wrap gap-2'>
            <Button
              variant='default'
              size='sm'
              onClick={handleFullRun}
              disabled={isProcessing}
              className='text-xs h-9 gap-2 flex-1'
            >
              {isProcessing && activeAction === 'full' ? (
                <Loader2 className='w-3.5 h-3.5 animate-spin' />
              ) : (
                <PlayCircle className='w-3.5 h-3.5' />
              )}
              수동 즉시 실행 (전체)
            </Button>

            <Button
              variant='outline'
              size='sm'
              onClick={handleAnalysisOnly}
              disabled={isProcessing}
              className='text-xs h-9 gap-2 flex-1'
            >
              {isProcessing && activeAction === 'analysis' ? (
                <Loader2 className='w-3.5 h-3.5 animate-spin' />
              ) : (
                <Search className='w-3.5 h-3.5' />
              )}
              미분석 피드 분석
            </Button>

            {(isProcessing || activeLog) && (
              <Button
                variant='secondary'
                size='sm'
                onClick={() => setIsModalOpen(true)}
                className='text-xs h-9 gap-2 w-full mt-1 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary'
              >
                <Activity className='w-3.5 h-3.5' />
                실시간 진행 상태 확인
              </Button>
            )}
          </div>

          <div className='pt-3 border-t border-border/30 space-y-3'>
            <div className='flex justify-between items-center text-sm'>
              <div className='flex items-center gap-2 text-muted-foreground'>
                <Clock className='w-3.5 h-3.5' />
                <span>자동 수집 주기</span>
              </div>
              <select 
                className='text-xs font-bold bg-transparent border-none focus:ring-0 cursor-pointer text-right outline-none hover:text-primary transition-colors disabled:opacity-50'
                value={syncInterval || '0 * * * *'}
                onChange={(e) => handleIntervalChange(e.target.value)}
                disabled={isUpdating}
              >
                {intervalOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            
            <div className='flex justify-between items-center text-sm'>
              <div className='flex items-center gap-2 text-muted-foreground'>
                <CheckCircle2 className='w-3.5 h-3.5' />
                <span>마지막 동기화</span>
              </div>
              <span className='font-medium text-foreground'>
                {lastSyncTime 
                  ? format(lastSyncTime, 'MM-dd HH:mm', { locale: ko }) 
                  : '기록 없음'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={handleModalClose}>
        <DialogContent className='sm:max-w-[400px]'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Activity className='w-5 h-5 text-primary' />
              파이프라인 진행 상태
            </DialogTitle>
          </DialogHeader>
          
          <div className='py-6 space-y-6'>
            <div className='space-y-4'>
              {displaySteps.map((step) => {
                const stepIdxInAll = allSteps.findIndex(s => s.id === step.id);
                const isCompleted = stepIdxInAll < currentStepIndex;
                const isActive = stepIdxInAll === currentStepIndex;
                
                return (
                  <div 
                    key={step.id} 
                    className={cn(
                      'flex items-center gap-4 p-3 rounded-lg transition-colors',
                      isActive ? 'bg-primary/10 border border-primary/20' : 'opacity-50',
                      isCompleted && 'opacity-100'
                    )}
                  >
                    <div className='flex-shrink-0'>
                      {isCompleted ? (
                        <CheckCircle2 className='w-5 h-5 text-green-500' />
                      ) : isActive ? (
                        <Loader2 className='w-5 h-5 text-primary animate-spin' />
                      ) : (
                        <Circle className='w-5 h-5 text-muted-foreground' />
                      )}
                    </div>
                    
                    <div className='flex-1'>
                      <p className={cn(
                        'text-sm font-semibold',
                        isActive ? 'text-primary' : 'text-foreground'
                      )}>
                        {step.label}
                      </p>
                      {isActive && (
                        <p className='text-xs text-primary/80 mt-1 font-mono'>
                          {activeLog?.error_message || (latchedStep === 0 ? '초기화 중...' : '마무리 중...')} 
                          {step.id === 'sync' && activeLog && ` (수집: ${activeLog.collected_count})`}
                          {step.id === 'analyze' && activeLog && ` (분석 완료: ${activeLog.analyzed_count})`}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className='flex justify-end pt-2'>
            <Button variant='outline' size='sm' onClick={() => handleModalClose(false)}>
              닫기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
