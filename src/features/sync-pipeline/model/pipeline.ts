/**
 * 수집과 분석 단계를 통합하여 실행하는 전체 파이프라인 제어 모듈입니다.
 */

import type { Feed } from '@/entities/feed/model/types';
import { analyzeFeedsBatch } from '@/features/analyze-feed/model/analysis-logic';
import { syncExpertFeed } from '@/features/sync-feed/model/sync-logic';
import { supabase } from '@/shared/api/supabase/client';

/**
 * 브라우저 종료 등으로 인해 '진행중' 상태로 멈춘 과거 로그들을 찾아 '중단됨' 처리합니다.
 */
export const cleanupStaleLogs = async () => {
  const { error } = await supabase
    .from('ts_pipeline_logs')
    .update({
      status: '수집 오류',
      ended_at: new Date().toISOString(),
      error_message: '비정상적 종료로 인해 실행이 중단되었습니다. (중단됨)',
    })
    .eq('status', '진행중');

  if (error) console.error('과거 로그 정리 실패:', error.message);
};

/**
 * 모든 전문가로부터 최신 피드를 수집하고, 신규 수집된 피대 대해 AI 분석을 실행합니다.
 * 실행 결과는 ts_pipeline_logs 테이블에 기록됩니다.
 * @returns {Promise<void>}
 */
export const runFullPipeline = async () => {
  // 실행 전 멈춘 로그 정리
  await cleanupStaleLogs();

  const { data: logData, error: logInitError } = await supabase
    .from('ts_pipeline_logs')
    .insert({ status: '진행중', collected_count: 0, analyzed_count: 0, error_message: '준비 중...' })
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

    const totalExperts = experts.length;
    for (let i = 0; i < totalExperts; i++) {
      const expert = experts[i];
      // 진행 상황 업데이트
      if (logId) {
        await supabase
          .from('ts_pipeline_logs')
          .update({ error_message: `피드 수집 중 (${i + 1}/${totalExperts})` })
          .eq('id', logId);
      }

      try {
        const count = await syncExpertFeed(expert.id, expert.twitter_handle);
        newCollectedThisRun += count;
      } catch (error: any) {
        console.error(`[Error] 전문가(${expert.twitter_handle}) 수집 실패:`, error);
        hasSyncError = true;
        combinedErrorMessage += `[@${expert.twitter_handle} 수집 실패: ${error.message}] `;
      }
    }

    // 이번 회차에 수집된 데이터가 없으면 분석 단계를 건너뜜
    if (newCollectedThisRun === 0) {
      console.log('새로 수집된 피드가 없어 분석 단계를 종료합니다.');
      if (logId) {
        await supabase
          .from('ts_pipeline_logs')
          .update({
            status: hasSyncError ? '수집 오류' : '완료',
            ended_at: new Date().toISOString(),
            collected_count: 0,
            error_message: hasSyncError ? combinedErrorMessage : '새로운 피드 없음 (완료)',
          })
          .eq('id', logId);
      }
      return;
    }

    // Phase 2: 미분석 피드 배치 분석
    totalAnalyzed = await executeAnalysisPhase(logId);

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
          error_message: combinedErrorMessage || '모든 공정 완료',
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
          status: '수집 오류',
          ended_at: new Date().toISOString(),
          error_message: error.message,
        })
        .eq('id', logId);
    }
    throw error;
  }
};

/**
 * 수집 없이 미분석 피드들만 골라 AI 분석을 수행합니다.
 * @returns {Promise<number>} 분석된 피드 수
 */
export const runAnalysisOnly = async () => {
  // 실행 전 멈춘 로그 정리
  await cleanupStaleLogs();

  const { data: logData, error: logInitError } = await supabase
    .from('ts_pipeline_logs')
    .insert({ status: '진행중', collected_count: 0, analyzed_count: 0, error_message: '분석 준비 중...' })
    .select()
    .single();

  if (logInitError) console.error('로그 초기화 실패:', logInitError.message);

  const logId = logData?.id;
  let totalAnalyzed = 0;

  try {
    totalAnalyzed = await executeAnalysisPhase(logId);

    if (logId) {
      await supabase
        .from('ts_pipeline_logs')
        .update({
          status: '완료',
          ended_at: new Date().toISOString(),
          analyzed_count: totalAnalyzed,
          error_message: '단독 분석 완료',
        })
        .eq('id', logId);
    }
    return totalAnalyzed;
  } catch (error: any) {
    console.error('❌ 분석 단독 실행 중 오류:', error);
    if (logId) {
      await supabase
        .from('ts_pipeline_logs')
        .update({
          status: '분석 오류',
          ended_at: new Date().toISOString(),
          error_message: error.message,
        })
        .eq('id', logId);
    }
    throw error;
  }
};

/**
 * 실제 AI 분석 단계를 수행하는 공통 로직입니다.
 */
async function executeAnalysisPhase(logId?: string) {
  const { data: unanalyzedFeeds, error: feedsError } = await supabase
    .from('ts_feeds')
    .select('*, ts_insights(id)')
    .returns<(Feed & { ts_insights: { id: string }[] })[]>();

  if (feedsError) throw new Error(`미분석 피드 조회 실패: ${feedsError.message}`);

  const feedsToAnalyze = (unanalyzedFeeds || []).filter(
    (f) => !f.ts_insights || f.ts_insights.length === 0,
  );

  let totalAnalyzedCount = 0;
  const totalToAnalyze = feedsToAnalyze.length;

  if (totalToAnalyze > 0) {
    console.log(`[AI 분석] 시작 (${totalToAnalyze}개)...`);
    const BATCH_SIZE = 10;
    
    for (let i = 0; i < totalToAnalyze; i += BATCH_SIZE) {
      const batch = feedsToAnalyze.slice(i, i + BATCH_SIZE);
      
      // 진행 상황 업데이트
      if (logId) {
        await supabase
          .from('ts_pipeline_logs')
          .update({ 
            error_message: `피드 분석 중 (${i + batch.length}/${totalToAnalyze})`,
            analyzed_count: totalAnalyzedCount
          })
          .eq('id', logId);
      }

      try {
        const results = await analyzeFeedsBatch(batch);
        totalAnalyzedCount += results.length;
        
        // 배치 직후 카운트 업데이트
        if (logId) {
          await supabase
            .from('ts_pipeline_logs')
            .update({ analyzed_count: totalAnalyzedCount })
            .eq('id', logId);
        }

        if (i + BATCH_SIZE < totalToAnalyze) {
          await new Promise((resolve) => setTimeout(resolve, 4000));
        }
      } catch (error: any) {
        console.error('[Error] AI 배치 분석 실패:', error);
        throw error;
      }
    }
  }
  return totalAnalyzedCount;
}
