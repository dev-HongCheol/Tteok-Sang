/**
 * 수집과 분석 단계를 통합하여 실행하는 전체 파이프라인 제어 모듈입니다.
 */

import type { Feed } from '@/entities/feed/model/types';
import { analyzeFeedsBatch } from '@/features/analyze-feed/model/analysis-logic';
import { syncExpertFeed } from '@/features/sync-feed/model/sync-logic';
import { supabase } from '@/shared/api/supabase/client';

/**
 * 모든 전문가로부터 최신 피드를 수집하고, 신규 수집된 피드에 대해 AI 분석을 실행합니다.
 * 실행 결과는 ts_pipeline_logs 테이블에 기록됩니다.
 * @returns {Promise<void>}
 */
export const runFullPipeline = async () => {
  const { data: logData, error: logInitError } = await supabase
    .from('ts_pipeline_logs')
    .insert({ status: '진행중', collected_count: 0, analyzed_count: 0 })
    .select()
    .single();

  if (logInitError) console.error('로그 초기화 실패:', logInitError.message);

  const logId = logData?.id;
  let newCollectedThisRun = 0; // 이번 실행에서 새로 수집된 수
  let totalAnalyzed = 0;
  let hasSyncError = false;
  let hasAnalysisError = false;
  let combinedErrorMessage = '';

  try {
    // Phase 1: 전문가 피드 수집
    const { data: experts, error: expertsError } = await supabase
      .from('ts_experts')
      .select('id, twitter_handle');

    if (expertsError) throw new Error(`전문가 목록 조회 실패: ${expertsError.message}`);

    for (const expert of experts) {
      try {
        const count = await syncExpertFeed(expert.id, expert.twitter_handle);
        newCollectedThisRun += count;
      } catch (error: any) {
        console.error(`[Error] 전문가(${expert.twitter_handle}) 수집 실패:`, error);
        hasSyncError = true;
        combinedErrorMessage += `[@${expert.twitter_handle} 수집 실패: ${error.message}] `;
      }
    }

    // [핵심 수정] 이번 회차에 수집된 데이터가 없으면 분석 단계를 건너뜀
    if (newCollectedThisRun === 0) {
      console.log('새로 수집된 피드가 없어 분석 단계를 종료합니다.');
      if (logId) {
        await supabase
          .from('ts_pipeline_logs')
          .update({
            status: hasSyncError ? '수집 오류' : '완료',
            ended_at: new Date().toISOString(),
            error_message: combinedErrorMessage || null,
          })
          .eq('id', logId);
      }
      return;
    }

    // Phase 2: 미분석 피드 배치 분석
    const { data: unanalyzedFeeds, error: feedsError } = await supabase
      .from('ts_feeds')
      .select('*, ts_insights(id)')
      .returns<(Feed & { ts_insights: { id: string }[] })[]>();

    if (feedsError) throw new Error(`미분석 피드 조회 실패: ${feedsError.message}`);

    const feedsToAnalyze = (unanalyzedFeeds || []).filter(
      (f) => !f.ts_insights || f.ts_insights.length === 0,
    );

    if (feedsToAnalyze.length > 0) {
      console.log(`[Phase 2] 분석 시작 (${feedsToAnalyze.length}개)...`);
      const BATCH_SIZE = 10;
      for (let i = 0; i < feedsToAnalyze.length; i += BATCH_SIZE) {
        const batch = feedsToAnalyze.slice(i, i + BATCH_SIZE);
        try {
          const results = await analyzeFeedsBatch(batch);
          totalAnalyzed += results.length;

          // API 할당량(RPM) 준수를 위해 배치 간 4초 지연
          await new Promise((resolve) => setTimeout(resolve, 4000));
        } catch (error: any) {
          console.error('[Error] AI 배치 분석 실패:', error);
          hasAnalysisError = true;
          combinedErrorMessage += `[AI 분석 실패: ${error.message}] `;
        }
      }
    }

    // 최종 로그 업데이트
    if (logId) {
      let finalStatus = '완료';
      if (hasAnalysisError) finalStatus = '분석 오류';
      else if (hasSyncError) finalStatus = '수집 오류';

      await supabase
        .from('ts_pipeline_logs')
        .update({
          status: finalStatus,
          ended_at: new Date().toISOString(),
          collected_count: newCollectedThisRun,
          analyzed_count: totalAnalyzed,
          error_message: combinedErrorMessage || null,
        })
        .eq('id', logId);
    }

    console.log(`✅ 파이프라인 완료. (수집: ${newCollectedThisRun}, 분석: ${totalAnalyzed})`);
  } catch (error: any) {
    console.error('❌ 치명적 오류:', error);
    if (logId) {
      await supabase
        .from('ts_pipeline_logs')
        .update({
          status: '시스템 오류',
          ended_at: new Date().toISOString(),
          error_message: error.message,
        })
        .eq('id', logId);
    }
    throw error;
  }
};
