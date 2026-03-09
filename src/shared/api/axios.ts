import axios from 'axios';
import { env } from '@/shared/config/env';

export const apiClient = axios.create({
  baseURL: env.NEXT_PUBLIC_SUPABASE_URL,
  headers: {
    'Content-Type': 'application/json',
    apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    Authorization: `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
  },
});
