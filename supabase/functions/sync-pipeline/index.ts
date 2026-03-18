// Supabase Edge Function: sync-pipeline
// 이 함수는 Deno 런타임에서 동작하며, pg_cron에 의해 주기적으로 호출되어 Next.js 파이프라인을 트리거합니다.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const APP_URL = Deno.env.get('APP_URL');
  const CRON_SECRET_KEY = Deno.env.get('CRON_SECRET_KEY');

  console.log('--- 파이프라인 트리거 프로세스 시작 ---');

  // 1. 환경 변수 확인
  if (!APP_URL || !CRON_SECRET_KEY) {
    console.error('환경 변수 미설정');
    return new Response(
      JSON.stringify({ error: '필수 환경 변수(APP_URL, CRON_SECRET_KEY)가 설정되지 않았습니다.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 2. 요청 보안 검증 (pg_cron -> Edge Function)
  const authHeader = req.headers.get('Authorization');
  if (authHeader !== `Bearer ${CRON_SECRET_KEY}`) {
    console.warn('허가되지 않은 접근 시도 차단');
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    console.log(`대상 서버 호출: ${APP_URL}/api/cron/sync`);
    
    // 3. Next.js API 호출 (Edge Function -> Next.js)
    const response = await fetch(`${APP_URL}/api/cron/sync`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CRON_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    console.log('Next.js 응답 결과:', result);

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
      status: response.status,
    });
  } catch (error: any) {
    console.error('트리거 도중 오류 발생:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
