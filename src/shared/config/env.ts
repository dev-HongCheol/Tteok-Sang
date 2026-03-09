import { z } from 'zod';

// 1. 클라이언트와 서버 공용으로 사용하는 변수 (NEXT_PUBLIC_)
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

// 2. 서버에서만 사용하는 변수 (Sensitive Keys)
const serverEnvSchema = z.object({
  GEMINI_API_KEY: z.string().min(1),
  CRON_SECRET_KEY: z.string().min(1), // 파이프라인 트리거 전용 키
});

// 3. 환경에 따른 검증 로직
const isServer = typeof window === 'undefined';

const publicParsed = publicEnvSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

if (!publicParsed.success) {
  console.error('❌ 유효하지 않은 공용 환경 변수입니다:', publicParsed.error.format());
  throw new Error('필수 공용 환경 변수가 설정되지 않았습니다.');
}

let serverParsedData = {};
if (isServer) {
  const serverParsed = serverEnvSchema.safeParse({
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    CRON_SECRET_KEY: process.env.CRON_SECRET_KEY,
  });

  if (!serverParsed.success) {
    console.error('❌ 유효하지 않은 서버 환경 변수입니다:', serverParsed.error.format());
    throw new Error('필수 서버 환경 변수가 설정되지 않았습니다.');
  }
  serverParsedData = serverParsed.data;
}

// 4. 최종 통합 env 객체 내보내기
export const env = {
  ...publicParsed.data,
  ...(isServer ? serverParsedData : {}) as z.infer<typeof serverEnvSchema>,
};
