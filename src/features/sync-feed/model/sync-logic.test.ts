// pnpm test run src/features/sync-feed/model/sync-logic.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '@/shared/api/supabase/client';
import { parseRssFeed } from '@/shared/lib/rss/parser';
import { syncExpertFeed } from './sync-logic';

// Supabase 모킹 개선
vi.mock('@/shared/api/supabase/client', () => {
  const mockSingle = vi.fn();
  const mockEq = vi.fn(() => ({ single: mockSingle }));
  const mockSelect = vi.fn(() => ({ eq: mockEq }));
  const mockUpsert = vi.fn();
  const mockUpdateEq = vi.fn();
  const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq }));

  return {
    supabase: {
      from: vi.fn(() => ({
        select: mockSelect,
        upsert: mockUpsert,
        update: mockUpdate,
      })),
    },
    // 테스트에서 접근하기 위한 export
    _mockSingle: mockSingle,
    _mockUpsert: mockUpsert,
    _mockUpdate: mockUpdate,
  };
});

vi.mock('@/shared/lib/rss/parser', () => ({
  parseRssFeed: vi.fn(),
}));

describe('syncExpertFeed', () => {
  const mockExpertId = 'expert-123';
  const mockTwitterHandle = 'testuser';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('새로운 피드가 있을 때 정상적으로 저장하고 last_synced_at을 업데이트해야 한다', async () => {
    const { _mockSingle, _mockUpsert, _mockUpdate } = (await import(
      '@/shared/api/supabase/client'
    )) as any;

    // 1. 전문가 정보 모킹
    const mockLastSyncedAt = '2026-03-01T00:00:00.000Z';
    _mockSingle.mockResolvedValue({
      data: { last_synced_at: mockLastSyncedAt },
      error: null,
    });

    // 2. RSS 피드 모킹
    const mockNewDate = '2026-03-02T10:00:00.000Z';
    (parseRssFeed as any).mockResolvedValue([
      {
        tweetId: 'tweet-999',
        isoDate: mockNewDate,
        contentSnippet: 'New content',
      },
    ]);

    _mockUpsert.mockResolvedValue({ error: null });

    // 3. 실행
    await syncExpertFeed(mockExpertId, mockTwitterHandle);

    // 4. 검증
    expect(_mockUpsert).toHaveBeenCalled();
    expect(_mockUpdate).toHaveBeenCalledWith({ last_synced_at: mockNewDate });
  });

  it('새로운 피드가 없으면 upsert를 호출하지 않아야 한다', async () => {
    const { _mockSingle, _mockUpsert } = (await import('@/shared/api/supabase/client')) as any;

    _mockSingle.mockResolvedValue({
      data: { last_synced_at: '2026-03-10T00:00:00.000Z' },
      error: null,
    });

    (parseRssFeed as any).mockResolvedValue([
      { tweetId: 'tweet-1', isoDate: '2026-03-09T00:00:00.000Z' }, // 과거 데이터
    ]);

    await syncExpertFeed(mockExpertId, mockTwitterHandle);

    expect(_mockUpsert).not.toHaveBeenCalled();
  });
});
