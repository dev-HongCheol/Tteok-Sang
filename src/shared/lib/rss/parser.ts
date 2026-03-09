import Parser from 'rss-parser';

export interface FeedItem extends Parser.Item {
  tweetId: string;
}

const parser = new Parser();

export const parseRssFeed = async (url: string): Promise<FeedItem[]> => {
  try {
    const feed = await parser.parseURL(url);

    return (
      feed.items.map((item) => {
        // Nitter RSS guid 예: 'https://nitter.net/user/status/123456789#m'
        // 여기서 숫자(123456789)만 추출하여 tweetId로 사용합니다.
        const tweetId = item.guid?.split('/').pop()?.split('#')[0] || '';

        return {
          ...item,
          tweetId,
        };
      }) || []
    );
  } catch (error) {
    console.error('RSS 파싱 중 오류가 발생했습니다:', error);
    throw error;
  }
};
