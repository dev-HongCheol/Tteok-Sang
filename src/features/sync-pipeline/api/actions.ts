'use server';

import { runFullPipeline } from '../model/pipeline';

/**
 * 서버 사이드에서 파이프라인을 실행합니다. (CORS 우회 및 보안 확보)
 */
export async function triggerPipelineAction() {
  try {
    await runFullPipeline();
    return { success: true };
  } catch (error: any) {
    console.error('Server Action Error:', error);
    return { success: false, error: error.message || '서버 실행 중 오류가 발생했습니다.' };
  }
}
