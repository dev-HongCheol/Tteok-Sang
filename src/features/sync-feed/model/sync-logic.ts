import { supabase } from '@/shared/api/supabase/client';
import { parseRssFeed } from '@/shared/lib/rss/parser';

/**
 * 전문가의 피드를 동기화하고 수집된 신규 피드 개수를 반환합니다.
 */
export const syncExpertFeed = async (expertId: string, twitterHandle: string): Promise<number> => {
  const { data: expert, error: expertError } = await supabase
    .from('ts_experts')
    .select('last_synced_at')
    .eq('id', expertId)
    .single();

  if (expertError) throw new Error(`전문가 정보 조회 실패: ${expertError.message}`);

  const lastSyncedAt = expert.last_synced_at ? new Date(expert.last_synced_at) : null;
  const rssUrl = `https://nitter.net/${twitterHandle}/rss`;
  
  const feeds = await parseRssFeed(rssUrl);

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
