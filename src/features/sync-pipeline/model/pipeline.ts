import type { Feed } from '@/entities/feed/model/types';
import { analyzeFeedsBatch } from '@/features/analyze-feed/model/analysis-logic';
import { syncExpertFeed } from '@/features/sync-feed/model/sync-logic';
import { supabase } from '@/shared/api/supabase/client';

/**
 * 프로젝트의 전체 수집 및 분석 파이프라인을 실행합니다.
 */
export const runFullPipeline = async () => {
  console.log('🚀 파이프라인 시작...');

  try {
    // Phase 1: 모든 전문가의 피드 수집
    console.log('[Phase 1] 전문가 피드 수집 중...');
    const { data: experts, error: expertsError } = await supabase
      .from('ts_experts')
      .select('id, twitter_handle');

    if (expertsError) throw new Error(`전문가 목록 조회 실패: ${expertsError.message}`);

    for (const expert of experts) {
      try {
        await syncExpertFeed(expert.id, expert.twitter_handle);
      } catch (error) {
        console.error(`[Error] 전문가(${expert.twitter_handle}) 수집 실패:`, error);
        // 한 전문가가 실패해도 다음 전문가 계속 진행
      }
    }

    // Phase 2: 미분석 피드 배치 분석
    console.log('[Phase 2] 미분석 피드 AI 분석 중...');

    // ts_insights에 존재하지 않는 피드만 조회 (Left Join 방식 활용)
    // Supabase JS 라이브러리의 한계로 인해, 여기서는 분석되지 않은 피드를 효율적으로 찾기 위해
    // ts_insights에 등록되지 않은 feed_id를 필터링하는 로직을 사용합니다.
    const { data: unanalyzedFeeds, error: feedsError } = await supabase
      .from('ts_feeds')
      .select('*, ts_insights!left(id)')
      .is('ts_insights.id', null);

    if (feedsError) throw new Error(`미분석 피드 조회 실패: ${feedsError.message}`);

    const feedsToAnalyze = (unanalyzedFeeds || []) as Feed[];
    console.log(`총 ${feedsToAnalyze.length}개의 미분석 피드가 발견되었습니다.`);

    // 10개씩 배치 처리
    const BATCH_SIZE = 10;
    for (let i = 0; i < feedsToAnalyze.length; i += BATCH_SIZE) {
      const batch = feedsToAnalyze.slice(i, i + BATCH_SIZE);
      console.log(
        `배치 분석 진행 중 (${i + 1} ~ ${Math.min(i + BATCH_SIZE, feedsToAnalyze.length)})`,
      );

      try {
        await analyzeFeedsBatch(batch);
        // 무료 티어 RPM 보호를 위한 짧은 지연 (1초)
        if (i + BATCH_SIZE < feedsToAnalyze.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error('[Error] 배치 분석 실패:', error);
      }
    }

    console.log('✅ 파이프라인 실행 완료.');
  } catch (error) {
    console.error('❌ 파이프라인 중명 오류:', error);
    throw error;
  }
};
