import { createClient } from '@supabase/supabase-js';
import { env } from '@/shared/config/env';

// Supabase 클라이언트 초기화
export const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
