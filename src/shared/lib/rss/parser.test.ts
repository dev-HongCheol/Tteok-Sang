// pnpm test run src/shared/lib/rss/parser.test.ts
/**
 * RSS 파서(Parser) 유틸리티에 대한 통합 테스트 모듈입니다.
 */
import { describe, it, expect } from 'vitest';
import { parseRssFeed } from './parser';

describe('parseRssFeed - Integration Test', () => {
  // 실제 Nitter 인스턴스 주소 (Alis 계정 예시)
  const realNitterRssUrl = 'https://nitter.net/Alisvolatprop12/rss';

  it('실제 Nitter RSS를 호출하여 tweetId와 날짜를 올바르게 파싱해야 한다', async () => {
    // 네트워크 상황에 따라 시간이 걸릴 수 있으므로 타임아웃 넉넉히 설정 (10초)
    const feeds = await parseRssFeed(realNitterRssUrl);

    // 1. 데이터가 존재해야 함
    expect(feeds.length).toBeGreaterThan(0);

    // 2. 첫 번째 아이템의 구조 검증
    const firstItem = feeds[0];
    
    console.log('--- 실제 데이터 샘플 ---');
    console.log('Title:', firstItem.title);
    console.log('Tweet ID:', firstItem.tweetId);
    console.log('Published At:', firstItem.isoDate);
    console.log('------------------------');

    // 3. 필드 유효성 검사
    // tweetId는 비어있지 않아야 하며 보통 숫자형 문자열임
    expect(firstItem.tweetId).not.toBe('');
    expect(firstItem.tweetId).toMatch(/^[a-zA-Z0-9]+$/); 

    // isoDate는 유효한 날짜 형식이어야 함
    expect(firstItem.isoDate).not.toBeUndefined();
    expect(new Date(firstItem.isoDate!).getTime()).toBeGreaterThan(0);
  }, 15000); // 15초 타임아웃
});
