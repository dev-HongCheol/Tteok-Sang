/**
 * Supabase 클라이언트 인스턴스를 관리하는 모듈입니다.
 */
import { createClient } from '@supabase/supabase-js';
import { env } from '@/shared/config/env';

/** 
 * Supabase 클라이언트 초기화
 * 공용 URL 및 Anon Key를 사용합니다.
 */
export const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
