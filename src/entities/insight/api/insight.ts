import { supabase } from '@/shared/api/supabase/client';
import type { Insight } from '../model/types';
import type { Feed } from '@/entities/feed/model/types';
import type { Expert } from '@/entities/expert/model/types';

export interface InsightWithDetails extends Insight {
  ts_feeds: Feed & {
    ts_experts: Expert;
  };
}

export interface GetInsightsParams {
  categories?: string[];
  importances?: string[];
  expertIds?: string[]; // undefined: 전체, []: 없음, [...]: 특정 ID
  startDate?: string;
  endDate?: string;
  searchQuery?: string;
}

/**
 * 필터 조건에 맞는 인사이트 목록을 조회합니다.
 */
export const getInsights = async (params: GetInsightsParams): Promise<InsightWithDetails[]> => {
  let query = supabase
    .from('ts_insights')
    .select(`
      *,
      ts_feeds!inner (
        *,
        ts_experts!inner (*)
      )
    `)
    .order('created_at', { ascending: false });

  // 1. 중요도 필터
  if (params.importances && params.importances.length > 0) {
    query = query.in('importance', params.importances);
  }

  // 2. 카테고리 필터
  if (params.categories && params.categories.length > 0 && !params.categories.includes('전체')) {
    query = query.in('category', params.categories);
  }

  // 2. 분석 계정(전문가) 필터
  if (params.expertIds !== undefined) {
    if (params.expertIds.length === 0) {
      // 명시적으로 아무것도 선택하지 않은 경우 -> 결과 없음 처리
      // 존재할 수 없는 UUID를 넣어 빈 결과를 유도합니다.
      query = query.eq('ts_feeds.expert_id', '00000000-0000-0000-0000-000000000000');
    } else {
      query = query.in('ts_feeds.expert_id', params.expertIds);
    }
  }

  // 3. 기간 필터
  if (params.startDate) {
    query = query.gte('ts_feeds.published_at', params.startDate);
  }
  if (params.endDate) {
    query = query.lte('ts_feeds.published_at', params.endDate);
  }

  // 4. 검색어 필터
  if (params.searchQuery) {
    query = query.or(`summary.ilike.%${params.searchQuery}%,ts_feeds.content.ilike.%${params.searchQuery}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('인사이트 조회 실패:', error.message);
    throw new Error(`인사이트 조회 실패: ${error.message}`);
  }

  return (data as any) || [];
};
