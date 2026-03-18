/**
 * 동기화 파이프라인 및 분석 트리거를 위한 Next.js Server Actions 모듈입니다.
 */
'use server';

import { supabase } from '@/shared/api/supabase/client';
import { runAnalysisOnly, runFullPipeline } from '../model/pipeline';

/**
 * 서버 사이드에서 전체 파이프라인(수집+분석)을 실행합니다.
 * @returns {Promise<{success: boolean, error?: string}>} 실행 성공 여부 및 에러 메시지
 */
export async function triggerPipelineAction() {
  try {
    await runFullPipeline();
    return { success: true };
  } catch (error: any) {
    console.error('Server Action Error (Full):', error);
    return { success: false, error: error.message || '서버 실행 중 오류가 발생했습니다.' };
  }
}

/**
 * 수집은 제외하고, 아직 분석되지 않은 피드들만 골라 AI 분석을 수행합니다.
 * @returns {Promise<{success: boolean, count?: number, error?: string, message?: string}>} 실행 결과 정보
 */
export async function triggerAnalysisOnlyAction() {
  try {
    const count = await runAnalysisOnly();

    if (count === 0) {
      return { success: true, count: 0, message: '분석할 새로운 피드가 없습니다.' };
    }

    return { success: true, count };
  } catch (error: any) {
    console.error('Server Action Error (Analysis Only):', error);
    return { success: false, error: error.message || '분석 중 오류가 발생했습니다.' };
  }
}

/**
 * DB에 저장된 동기화 주기를 업데이트합니다.
 * @param {string} cronExpression Cron 표현식 (예: "0 2 * * *")
 * @returns {Promise<{success: boolean, error?: string}>} 결과
 */
export async function updateSyncIntervalAction(cronExpression: string) {
  try {
    const { error } = await supabase
      .from('ts_settings')
      .upsert({ key: 'sync_interval', value: cronExpression }, { onConflict: 'key' });

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Update Interval Error:', error);
    return { success: false, error: error.message };
  }
}
