import { supabase } from '@/shared/api/supabase/client';
import { parseRssFeed } from '@/shared/lib/rss/parser';

export const syncExpertFeed = async (expertId: string, twitterHandle: string) => {
  // 1. 전문가의 마지막 동기화 시점 확인
  const { data: expert, error: expertError } = await supabase
    .from('ts_experts')
    .select('last_synced_at')
    .eq('id', expertId)
    .single();

  if (expertError) throw new Error(`전문가 정보 조회 실패: ${expertError.message}`);

  const lastSyncedAt = expert.last_synced_at ? new Date(expert.last_synced_at) : null;

  // 2. RSS 피드 패칭
  const rssUrl = `https://nitter.net/${twitterHandle}/rss`;
  const feeds = await parseRssFeed(rssUrl);

  // 3. 증분 동기화 로직 적용 (최신순 필터링)
  const newFeeds = feeds.filter((item) => {
    if (!item.isoDate) return false;
    const publishedAt = new Date(item.isoDate);
    // lastSyncedAt이 없으면(최초 수집) 모두 포함, 있으면 더 최신 데이터만 포함
    return !lastSyncedAt || publishedAt > lastSyncedAt;
  });

  if (newFeeds.length === 0) {
    console.log(`${twitterHandle}: 새로운 피드가 없습니다.`);
    return;
  }

  // 4. DB 저장 (ts_feeds)
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

  // 5. 전문가 동기화 시점 업데이트 (가장 최신 트윗 시점으로)
  const latestPublishedAt = newFeeds[0].isoDate; // RSS는 보통 최신순으로 제공됨
  if (latestPublishedAt) {
    await supabase
      .from('ts_experts')
      .update({ last_synced_at: latestPublishedAt })
      .eq('id', expertId);
  }

  console.log(`${twitterHandle}: ${newFeeds.length}개의 새로운 피드 동기화 완료.`);
};
