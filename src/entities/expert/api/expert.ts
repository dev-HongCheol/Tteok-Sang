import { supabase } from '@/shared/api/supabase/client';
import type { Expert, CreateExpert, UpdateExpert } from '../model/types';

/**
 * 모든 전문가 목록을 조회합니다.
 */
export const getExperts = async (): Promise<Expert[]> => {
  const { data, error } = await supabase
    .from('ts_experts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`전문가 조회 실패: ${error.message}`);
  return data || [];
};

/**
 * 새로운 전문가를 등록합니다.
 */
export const addExpert = async (expert: CreateExpert): Promise<Expert> => {
  const { data, error } = await supabase
    .from('ts_experts')
    .insert(expert)
    .select()
    .single();

  if (error) throw new Error(`전문가 등록 실패: ${error.message}`);
  return data;
};

/**
 * 전문가 정보를 수정합니다.
 */
export const updateExpert = async (id: string, updates: UpdateExpert): Promise<Expert> => {
  const { data, error } = await supabase
    .from('ts_experts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`전문가 수정 실패: ${error.message}`);
  return data;
};

/**
 * 전문가를 삭제합니다.
 */
export const deleteExpert = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('ts_experts')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`전문가 삭제 실패: ${error.message}`);
};
