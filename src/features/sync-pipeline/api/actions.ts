/**
 * 동기화 파이프라인 및 분석 트리거를 위한 Next.js Server Actions 모듈입니다.
 */
'use server';

import type { Feed } from '@/entities/feed/model/types';
import { analyzeFeedsBatch } from '@/features/analyze-feed/model/analysis-logic';
import { supabase } from '@/shared/api/supabase/client';
import { runFullPipeline } from '../model/pipeline';

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
    // 1. 미분석 피드 조회
    const { data: unanalyzedFeeds, error: feedsError } = await supabase
      .from('ts_feeds')
      .select('*, ts_insights(id)')
      .returns<(Feed & { ts_insights: { id: string }[] })[]>();

    if (feedsError) throw new Error(`미분석 피드 조회 실패: ${feedsError.message}`);

    const feedsToAnalyze = (unanalyzedFeeds || []).filter(
      (f) => !f.ts_insights || f.ts_insights.length === 0,
    );

    if (feedsToAnalyze.length === 0) {
      return { success: true, count: 0, message: '분석할 새로운 피드가 없습니다.' };
    }

    // 2. 배치 분석 실행 (최대 10개 단위)
    let totalAnalyzed = 0;
    const BATCH_SIZE = 10;

    for (let i = 0; i < feedsToAnalyze.length; i += BATCH_SIZE) {
      const batch = feedsToAnalyze.slice(i, i + BATCH_SIZE);
      const results = await analyzeFeedsBatch(batch);
      totalAnalyzed += results.length;

      // RPM 보호를 위한 짧은 지연
      if (i + BATCH_SIZE < feedsToAnalyze.length) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    return { success: true, count: totalAnalyzed };
  } catch (error: any) {
    console.error('Server Action Error (Analysis Only):', error);
    return { success: false, error: error.message || '분석 중 오류가 발생했습니다.' };
  }
}
