/**
 * 전문가의 트위터 RSS 피드를 수집하고 데이터베이스에 동기화하는 비즈니스 로직 모듈입니다.
 */
import { supabase } from '@/shared/api/supabase/client';

/** 파이프라인에서 받아온 피드 아이템 타입 */
interface SyncPipelineResponse {
  feeds: {
    tweetId: string;
    title?: string;
    contentSnippet?: string;
    isoDate?: string;
    link?: string;
    [key: string]: any;
  }[];
}

/**
 * 전문가의 피드를 동기화하고 수집된 신규 피드 개수를 반환합니다.
 * @param {string} expertId 전문가 고유 ID
 * @param {string} twitterHandle 전문가의 트위터 핸들
 * @returns {Promise<number>} 수집된 신규 피드 개수
 */
export const syncExpertFeed = async (expertId: string, twitterHandle: string): Promise<number> => {
  const { data: expert, error: expertError } = await supabase
    .from('ts_experts')
    .select('last_synced_at')
    .eq('id', expertId)
    .single();

  if (expertError) throw new Error(`전문가 정보 조회 실패: ${expertError.message}`);

  const lastSyncedAt = expert.last_synced_at ? new Date(expert.last_synced_at) : null;
  
  // Vercel IP 차단을 우회하기 위해 셀프 호스팅 Supabase Edge Function 호출
  console.log(`[Vercel] Edge Function을 통한 피드 수집 시도: ${twitterHandle}`);
  const { data: pipelineData, error: pipelineError } = await supabase.functions.invoke<SyncPipelineResponse>('sync-pipeline', {
    body: { handle: twitterHandle },
  });

  if (pipelineError || !pipelineData?.feeds) {
    throw new Error(`Edge Function 수집 실패 (${twitterHandle}): ${pipelineError?.message || '결과 없음'}`);
  }

  const feeds = pipelineData.feeds;

  const newFeeds = feeds.filter((item) => {
    if (!item.isoDate) return false;
    const publishedAt = new Date(item.isoDate);
    return !lastSyncedAt || publishedAt > lastSyncedAt;
  });

  if (newFeeds.length === 0) {
    console.log(`${twitterHandle}: 새로운 피드가 없습니다.`);
    return 0;
  }

  const feedsToInsert = newFeeds.map((item) => ({
    expert_id: expertId,
    tweet_id: item.tweetId,
    content: item.contentSnippet || item.title || '',
    published_at: item.isoDate as string,
    raw_data: item,
  }));

  const { error: insertError } = await supabase.from('ts_feeds').upsert(feedsToInsert, {
    onConflict: 'tweet_id',
  });

  if (insertError) throw new Error(`피드 저장 실패: ${insertError.message}`);

  const latestPublishedAt = newFeeds[0].isoDate;
  if (latestPublishedAt) {
    await supabase.from('ts_experts').update({ last_synced_at: latestPublishedAt }).eq('id', expertId);
  }

  console.log(`${twitterHandle}: ${newFeeds.length}개의 새로운 피드 동기화 완료.`);
  return newFeeds.length;
};
