/**
 * RSS 피드 수집 및 파싱을 담당하는 유틸리티 모듈입니다.
 */
import Parser from 'rss-parser';

/** 파싱된 피드 아이템 인터페이스 (트윗 ID 포함) */
export interface FeedItem extends Parser.Item {
  /** 수집된 피드의 고유 트윗 ID */
  tweetId: string;
}

const parser = new Parser();

/**
 * 지정된 URL의 RSS 피드를 파싱하여 트윗 ID가 포함된 아이템 배열을 반환합니다.
 * @param {string} url 파싱할 RSS 피드 URL
 * @returns {Promise<FeedItem[]>} 파싱된 피드 아이템 배열
 */
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
