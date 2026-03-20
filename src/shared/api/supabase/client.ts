/**
 * Supabase 클라이언트 인스턴스를 관리하는 모듈입니다.
 */
import { createClient } from '@supabase/supabase-js';
import { env } from '@/shared/config/env';

/** 
 * Supabase 클라이언트 초기화
 * 공용 URL 및 Anon Key를 사용합니다.
 * 서버 사이드 실행 시 Cloudflare WAF 우회를 위한 커스텀 헤더를 주입합니다.
 */
export const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    global: {
      headers: (env as any).SUPABASE_WAF_SECRET 
        ? { 'X-Vercel-Verify': (env as any).SUPABASE_WAF_SECRET } 
        : undefined
    }
  }
);
