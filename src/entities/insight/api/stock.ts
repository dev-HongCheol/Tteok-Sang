/**
 * 종목 마스터(Stock) 엔티티와 관련된 API 요청을 처리하는 모듈입니다.
 */
import { supabase } from '@/shared/api/supabase/client';
import type { Stock } from '../model/types';

/**
 * 모든 종목 목록을 조회합니다.
 * @returns {Promise<Stock[]>} 종목 목록 배열
 */
export const getStocks = async (): Promise<Stock[]> => {
  const { data, error } = await supabase
    .from('ts_stocks')
    .select('*')
    .order('mention_count', { ascending: false });

  if (error) throw new Error(`종목 조회 실패: ${error.message}`);
  return data || [];
};

/**
 * 검증되지 않은 종목 목록만 조회합니다.
 * @returns {Promise<Stock[]>} 미검증 종목 목록
 */
export const getUnverifiedStocks = async (): Promise<Stock[]> => {
  const { data, error } = await supabase
    .from('ts_stocks')
    .select('*')
    .eq('is_verified', false)
    .order('mention_count', { ascending: false });

  if (error) throw new Error(`미검증 종목 조회 실패: ${error.message}`);
  return data || [];
};

/**
 * 특정 종목 정보를 업데이트합니다.
 */
export const updateStock = async (ticker: string, updates: Partial<Stock>): Promise<Stock> => {
  // 1. 마스터 데이터 업데이트
  const { data, error } = await supabase
    .from('ts_stocks')
    .update(updates)
    .eq('ticker', ticker)
    .select()
    .single();

  if (error) throw new Error(`종목 수정 실패: ${error.message}`);

  // 2. 전수 데이터 정규화 실행 (Global Rebalance)
  // 티커, 이름, 또는 별칭이 변경된 경우 과거의 모든 인사이트 JSON 스냅샷을 마스터 기준으로 강제 동기화합니다.
  if (updates.ticker || updates.name_ko || updates.aliases) {
    await supabase.rpc('global_rebalance_insights');
  }

  return data;
};

/**
 * 특정 종목을 검증 완료 상태로 변경하고 정보를 업데이트합니다.
 */
export const verifyStock = async (ticker: string, updates: Partial<Stock>): Promise<Stock> => {
  const { data, error } = await supabase
    .from('ts_stocks')
    .update({ ...updates, is_verified: true })
    .eq('ticker', ticker)
    .select()
    .single();

  if (error) throw new Error(`종목 검증 실패: ${error.message}`);

  // 승인 시에도 전수 정규화를 실행하여 'is_verified' 상태를 모든 과거 데이터에 전파합니다.
  await supabase.rpc('global_rebalance_insights');

  return data;
};

/**
 * 새로운 종목을 마스터 데이터에 추가합니다.
 * @param {Partial<Stock>} stock 추가할 종목 정보
 * @returns {Promise<Stock>} 추가된 종목 객체
 */
export const addStock = async (stock: Partial<Stock>): Promise<Stock> => {
  const { data, error } = await supabase.from('ts_stocks').insert(stock).select().single();

  if (error) throw new Error(`종목 추가 실패: ${error.message}`);
  return data;
};

/**
 * 종목의 언급 횟수를 증가시킵니다.
 * @param {string} ticker 티커
 */
export const incrementMentionCount = async (ticker: string): Promise<void> => {
  // RPC를 사용하여 원자적으로 증가시키는 것이 좋지만,
  // 여기서는 간단히 로직으로 처리하거나 추후 RPC 추가 가능
  const { error } = await supabase.rpc('increment_stock_mention', { stock_ticker: ticker });

  if (error) {
    // RPC가 없는 경우를 대비한 폴백 (성능상 불리할 수 있음)
    console.warn('increment_stock_mention RPC missing, skipping count increment');
  }
};
