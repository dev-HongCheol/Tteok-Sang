// pnpm test run src/features/analyze-feed/model/analysis-logic.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeFeedsBatch } from './analysis-logic';
import { geminiModel } from '@/shared/api/gemini/client';
import { supabase } from '@/shared/api/supabase/client';
import type { Feed } from '@/entities/feed/model/types';

// 모듈 모킹
vi.mock('@/shared/api/gemini/client', () => ({
  geminiModel: {
    generateContent: vi.fn(),
  },
}));

vi.mock('@/shared/api/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('analyzeFeedsBatch', () => {
  const mockFeeds: Feed[] = [
    { id: 'feed-1', content: '삼성전자 반도체 전망...', expert_id: 'e1', tweet_id: 't1', published_at: '', raw_data: null, created_at: '' },
    { id: 'feed-2', content: '오늘 점심 메뉴는 돈까스', expert_id: 'e1', tweet_id: 't2', published_at: '', raw_data: null, created_at: '' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('여러 피드를 한꺼번에 분석하고 DB에 배치 저장해야 한다', async () => {
    // 1. Gemini 응답 모킹 (배열 형태)
    const mockBatchResponse = [
      {
        feed_id: 'feed-1',
        relevance_score: 90,
        summary: '반도체 호재',
        importance: 'High',
        category: '반도체',
      },
      {
        feed_id: 'feed-2',
        relevance_score: 5,
        summary: '일상',
        importance: 'Low',
        category: '기타',
      },
    ];
    (geminiModel.generateContent as any).mockResolvedValue({
      response: { text: () => JSON.stringify(mockBatchResponse) },
    });

    // 2. Supabase 모킹
    const mockInsert = vi.fn(() => ({ error: null }));
    (supabase.from as any).mockReturnValue({ insert: mockInsert });

    // 3. 배치 분석 실행
    const result = await analyzeFeedsBatch(mockFeeds);

    // 4. 검증
    expect(result.length).toBe(2);
    expect(supabase.from).toHaveBeenCalledWith('ts_insights');
    expect(mockInsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ feed_id: 'feed-1', relevance_score: 90 }),
        expect.objectContaining({ feed_id: 'feed-2', relevance_score: 5 }),
      ])
    );
  });

  it('피드 배열이 비어있으면 즉시 빈 배열을 반환해야 한다', async () => {
    const result = await analyzeFeedsBatch([]);
    expect(result).toEqual([]);
    expect(geminiModel.generateContent).not.toHaveBeenCalled();
  });

  it('AI 응답이 JSON 배열 형식이 아니면 에러를 발생시켜야 한다', async () => {
    // 단일 객체 응답 (배열이 아님)
    (geminiModel.generateContent as any).mockResolvedValue({
      response: { text: () => JSON.stringify({ feed_id: '1' }) },
    });

    await expect(analyzeFeedsBatch(mockFeeds)).rejects.toThrow();
  });

  it('1,000자가 넘는 긴 피드 내용도 정상적으로 처리해야 한다', async () => {
    const longContent = 'A'.repeat(1200);
    const longFeeds: Feed[] = [
      { id: 'long-1', content: longContent, expert_id: 'e1', tweet_id: 't3', published_at: '', raw_data: null, created_at: '' },
    ];

    const mockResponse = [{
      feed_id: 'long-1',
      relevance_score: 50,
      summary: 'Long content summary',
      importance: 'Low',
      category: '기타',
    }];

    (geminiModel.generateContent as any).mockResolvedValue({
      response: { text: () => JSON.stringify(mockResponse) },
    });

    const mockInsert = vi.fn(() => ({ error: null }));
    (supabase.from as any).mockReturnValue({ insert: mockInsert });

    const result = await analyzeFeedsBatch(longFeeds);
    
    expect(result[0].feed_id).toBe('long-1');
    expect(geminiModel.generateContent).toHaveBeenCalled();
  });
});
