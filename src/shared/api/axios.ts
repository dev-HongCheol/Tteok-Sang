/**
 * Axios 클라이언트 인스턴스를 관리하는 모듈입니다.
 */
import axios from 'axios';
import { env } from '@/shared/config/env';

/** Supabase API 호출을 위한 기본 Axios 인스턴스 */
export const apiClient = axios.create({
  baseURL: env.NEXT_PUBLIC_SUPABASE_URL,
  headers: {
    'Content-Type': 'application/json',
    apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    Authorization: `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
  },
});
