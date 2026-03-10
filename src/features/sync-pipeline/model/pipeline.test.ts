// pnpm test run src/features/sync-pipeline/model/pipeline.test.ts
/**
 * 전체 동기화 파이프라인(수집-분석 통합 프로세스)에 대한 단위 테스트 모듈입니다.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runFullPipeline } from './pipeline';
import { supabase } from '@/shared/api/supabase/client';
import { syncExpertFeed } from '@/features/sync-feed/model/sync-logic';
import { analyzeFeedsBatch } from '@/features/analyze-feed/model/analysis-logic';

// 의존성 모킹
vi.mock('@/shared/api/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('@/features/sync-feed/model/sync-logic', () => ({
  syncExpertFeed: vi.fn(),
}));

vi.mock('@/features/analyze-feed/model/analysis-logic', () => ({
  analyzeFeedsBatch: vi.fn(),
}));

describe('runFullPipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('모든 전문가를 순회하며 피드를 수집하고 미분석 피드를 배치 분석해야 한다', async () => {
    // 1. 전문가 목록 모킹
    const mockExperts = [
      { id: 'e1', twitter_handle: 'user1' },
      { id: 'e2', twitter_handle: 'user2' },
    ];
    (supabase.from as any).mockReturnValueOnce({
      select: vi.fn().mockResolvedValue({ data: mockExperts, error: null }),
    });

    // 2. 미분석 피드 목록 모킹 (Left Join 결과 시뮬레이션)
    const mockUnanalyzedFeeds = [
      { id: 'f1', content: 'content1' },
      { id: 'f2', content: 'content2' },
    ];
    (supabase.from as any).mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        is: vi.fn().mockResolvedValue({ data: mockUnanalyzedFeeds, error: null }),
      }),
    });

    // 3. 파이프라인 실행
    await runFullPipeline();

    // 4. 검증: 전문가별 수집 함수 호출 여부
    expect(syncExpertFeed).toHaveBeenCalledTimes(2);
    expect(syncExpertFeed).toHaveBeenCalledWith('e1', 'user1');
    expect(syncExpertFeed).toHaveBeenCalledWith('e2', 'user2');

    // 5. 검증: 배치 분석 함수 호출 여부
    expect(analyzeFeedsBatch).toHaveBeenCalledWith(mockUnanalyzedFeeds);
  });

  it('수집 중 일부 전문가가 실패해도 나머지 프로세스를 계속 진행해야 한다', async () => {
    // 1. 전문가 목록 모킹
    (supabase.from as any).mockReturnValueOnce({
      select: vi.fn().mockResolvedValue({ data: [{ id: 'e1', twitter_handle: 'fail' }, { id: 'e2', twitter_handle: 'ok' }], error: null }),
    });

    // 2. 첫 번째 전문가 수집 실패 모킹
    (syncExpertFeed as any).mockRejectedValueOnce(new Error('Sync Failed'));

    // 3. 미분석 피드 조회 모킹 (빈 배열)
    (supabase.from as any).mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        is: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    });

    // 4. 파이프라인 실행
    await runFullPipeline();

    // 5. 검증: 실패와 상관없이 두 번째 전문가까지 호출되었는지 확인
    expect(syncExpertFeed).toHaveBeenCalledTimes(2);
    expect(syncExpertFeed).toHaveBeenLastCalledWith('e2', 'ok');
  });
});
