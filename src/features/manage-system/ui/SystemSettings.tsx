'use client';

import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/shared/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';
import { triggerPipelineAction } from '@/features/sync-pipeline/api/actions';
import { useState } from 'react';

export function SystemSettings() {
  const queryClient = useQueryClient();
  const [isManualRunning, setIsManualRunning] = useState(false);

  // 수동 실행 함수 (Server Action 활용)
  const handleManualRun = async () => {
    if (isManualRunning) return;
    setIsManualRunning(true);
    toast.info('서버에서 파이프라인 실행을 시작합니다...');
    
    try {
      const result = await triggerPipelineAction();
      
      if (result.success) {
        toast.success('파이프라인 실행이 완료되었습니다.');
      } else {
        toast.error('파이프라인 실행 실패', {
          description: result.error,
        });
      }
      
      // 로그 목록 갱신
      queryClient.invalidateQueries({ queryKey: ['pipeline-logs'] });
    } catch (error: any) {
      console.error('Manual Run Error:', error);
      toast.error('네트워크 오류가 발생했습니다.');
    } finally {
      setIsManualRunning(false);
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-lg flex justify-between items-center">
          시스템 제어
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleManualRun} 
            disabled={isManualRunning}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isManualRunning ? 'animate-spin' : ''}`} />
            수동 즉시 실행
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          현재 수집 주기: <strong>매 시간 정각 (Cron: 0 * * * *)</strong>
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          * 수집은 서버 사이드에서 안전하게 처리됩니다.
        </p>
      </CardContent>
    </Card>
  );
}
