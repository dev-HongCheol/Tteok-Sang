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
    const mockBatchResponse = [
      {
        batch_index: 0,
        relevance_score: 90,
        importance: 'High',
        market_type: 'KR',
        mentioned_stocks: [{ ticker: '005930', name_ko: '삼성전자' }],
        is_explicit: true,
        sectors: ['반도체'],
        sentiment_direction: 'Bullish',
        sentiment_intensity: 4,
        investment_horizon: 'swing',
        confidence_level: 'high',
        logic_type: ['valuation'],
        summary_line: '반도체 호재',
      },
      {
        batch_index: 1,
        relevance_score: 5,
        importance: 'Low',
        market_type: 'KR',
        mentioned_stocks: [],
        is_explicit: false,
        sectors: ['기타(분류외)'],
        sentiment_direction: 'Neutral',
        sentiment_intensity: 1,
        investment_horizon: 'intraday',
        confidence_level: 'medium',
        logic_type: ['macro'],
        summary_line: '일상',
      },
    ];
    (geminiModel.generateContent as any).mockResolvedValue({
      response: { text: () => JSON.stringify(mockBatchResponse) },
    });

    const mockSelect = vi.fn(() => ({ data: mockBatchResponse.map(b => ({ ...b, feed_id: mockFeeds[b.batch_index].id })), error: null }));
    const mockInsert = vi.fn(() => ({ select: mockSelect }));
    (supabase.from as any).mockReturnValue({ insert: mockInsert });

    const result = await analyzeFeedsBatch(mockFeeds);

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

  it('AI 응답이 잘못되었을 경우 에러를 던지는 대신 분석불가(Fallback) 처리해야 한다', async () => {
    // 단일 객체 응답 (배열이 아님) -> Zod 파싱 에러 유도
    (geminiModel.generateContent as any).mockResolvedValue({
      response: { text: () => JSON.stringify({ batch_index: 1 }) },
    });

    // 폴백 저장 시 1개의 데이터를 반환하도록 모킹 (각 재시도마다 1개씩 총 2개 기대)
    const mockSelect = vi.fn(() => ({ data: [{}], error: null }));
    const mockInsert = vi.fn(() => ({ select: mockSelect }));
    (supabase.from as any).mockReturnValue({ insert: mockInsert });

    const result = await analyzeFeedsBatch(mockFeeds);
    
    // 에러를 던지지 않고 2개 결과(Fallback)를 반환해야 함
    expect(result.length).toBe(2);
    expect(mockInsert).toHaveBeenCalledTimes(2); // 각 분할된 시도 끝에 실패하여 총 2회 insert 호출
  });

  it('전체 텍스트 길이가 권장 길이를 넘으면 배치를 분할해야 한다', async () => {
    const longContent = 'A'.repeat(3000); // 2개 합치면 6000자 (> 5000자)
    const longFeeds: Feed[] = [
      { id: 'long-1', content: longContent, expert_id: 'e1', tweet_id: 't3', published_at: '', raw_data: null, created_at: '' },
      { id: 'long-2', content: longContent, expert_id: 'e1', tweet_id: 't4', published_at: '', raw_data: null, created_at: '' },
    ];

    // 각 분할된 요청에 대한 응답 설정
    (geminiModel.generateContent as any).mockResolvedValue({
      response: { text: () => JSON.stringify([{
        batch_index: 0,
        relevance_score: 50,
        importance: 'Low',
        market_type: 'KR',
        mentioned_stocks: [],
        is_explicit: false,
        sectors: ['기타(분류외)'],
        sentiment_direction: 'Neutral',
        sentiment_intensity: 1,
        investment_horizon: 'intraday',
        confidence_level: 'medium',
        logic_type: ['macro'],
        summary_line: 'split summary',
      }]) },
    });

    const mockSelect = vi.fn(() => ({ data: [{}], error: null }));
    const mockInsert = vi.fn(() => ({ select: mockSelect }));
    (supabase.from as any).mockReturnValue({ insert: mockInsert });

    const result = await analyzeFeedsBatch(longFeeds);
    
    expect(result.length).toBe(2);
    // 2번 각각 호출되어야 함 (분할되었으므로)
    expect(geminiModel.generateContent).toHaveBeenCalledTimes(2);
    expect(mockInsert).toHaveBeenCalledTimes(2);
  });
});
