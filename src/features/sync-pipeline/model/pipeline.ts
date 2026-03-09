import type { Feed } from '@/entities/feed/model/types';
import { analyzeFeedsBatch } from '@/features/analyze-feed/model/analysis-logic';
import { syncExpertFeed } from '@/features/sync-feed/model/sync-logic';
import { supabase } from '@/shared/api/supabase/client';

/**
 * 프로젝트의 전체 수집 및 분석 파이프라인을 실행합니다.
 */
export const runFullPipeline = async () => {
  console.log('🚀 파이프라인 시작...');

  // 0. 실행 로그 시작 기록
  const { data: logData, error: logInitError } = await supabase
    .from('ts_pipeline_logs')
    .insert({ status: null, collected_count: 0, analyzed_count: 0 })
    .select()
    .single();

  if (logInitError) {
    console.error('로그 초기화 실패:', logInitError.message);
  }

  const logId = logData?.id;
  let totalCollected = 0;
  let totalAnalyzed = 0;

  try {
    // Phase 1: 모든 전문가의 피드 수집
    console.log('[Phase 1] 전문가 피드 수집 중...');
    const { data: experts, error: expertsError } = await supabase
      .from('ts_experts')
      .select('id, twitter_handle');

    if (expertsError) throw new Error(`전문가 목록 조회 실패: ${expertsError.message}`);

    for (const expert of experts) {
      try {
        // 이 회차에서 수집된 실제 수를 추적하기 위해 syncExpertFeed를 약간 확장하거나
        // 여기서는 전체 수집된 피드 수를 나중에 한 번에 셉니다.
        await syncExpertFeed(expert.id, expert.twitter_handle);
      } catch (error) {
        console.error(`[Error] 전문가(${expert.twitter_handle}) 수집 실패:`, error);
      }
    }

    // Phase 2: 미분석 피드 배치 분석
    console.log('[Phase 2] 미분석 피드 AI 분석 중...');

    const { data: unanalyzedFeeds, error: feedsError } = await supabase
      .from('ts_feeds')
      .select('*, ts_insights!left(id)')
      .is('ts_insights.id', null);

    if (feedsError) throw new Error(`미분석 피드 조회 실패: ${feedsError.message}`);

    const feedsToAnalyze = (unanalyzedFeeds || []) as Feed[];
    totalCollected = feedsToAnalyze.length; // 이번에 수집되어 분석을 기다리는 데이터 수
    console.log(`총 ${feedsToAnalyze.length}개의 미분석 피드가 발견되었습니다.`);

    const BATCH_SIZE = 10;
    for (let i = 0; i < feedsToAnalyze.length; i += BATCH_SIZE) {
      const batch = feedsToAnalyze.slice(i, i + BATCH_SIZE);
      console.log(
        `배치 분석 진행 중 (${i + 1} ~ ${Math.min(i + BATCH_SIZE, feedsToAnalyze.length)})`,
      );

      try {
        const results = await analyzeFeedsBatch(batch);
        totalAnalyzed += results.length;

        if (i + BATCH_SIZE < feedsToAnalyze.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error('[Error] 배치 분석 실패:', error);
      }
    }

    // 3. 성공 로그 업데이트
    if (logId) {
      await supabase
        .from('ts_pipeline_logs')
        .update({
          status: 'success',
          ended_at: new Date().toISOString(),
          collected_count: totalCollected,
          analyzed_count: totalAnalyzed,
        })
        .eq('id', logId);
    }

    console.log('✅ 파이프라인 실행 완료.');
  } catch (error: any) {
    console.error('❌ 파이프라인 중대한 오류:', error);

    // 4. 실패 로그 업데이트
    if (logId) {
      await supabase
        .from('ts_pipeline_logs')
        .update({
          status: 'error',
          ended_at: new Date().toISOString(),
          error_message: error.message || String(error),
        })
        .eq('id', logId);
    }
    throw error;
  }
};
