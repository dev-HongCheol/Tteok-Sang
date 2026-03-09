// Supabase Edge Function: sync-pipeline
// 이 함수는 Deno 런타임에서 동작하며, pg_cron에 의해 주기적으로 호출되어 Next.js 파이프라인을 트리거합니다.

/**
 * [ 셀프 호스팅 Supabase (Docker Compose) 설정 가이드 ]
 * 
 * 1. 보안 주의 (Security Warning)
 *    - 절대로 JWT_SECRET을 외부 트리거용 헤더로 공유하지 마세요. (시스템 마스터키 노출 위험)
 *    - 반드시 전용 키인 'CRON_SECRET_KEY'를 생성하여 사용하세요.
 * 
 * 2. 인프라 환경 변수 설정
 *    - 대상 파일: Supabase 설치 폴더의 'docker-compose.yml' 및 '.env'
 *    - .env 파일 수정:
 *        APP_URL=https://tteok-sang.devhong.cc
 *        CRON_SECRET_KEY=long_random_string_here
 *    - docker-compose.yml (functions 서비스 섹션) 수정:
 *        environment:
 *          APP_URL: ${APP_URL}
 *          CRON_SECRET_KEY: ${CRON_SECRET_KEY}
 * 
 * 3. 설정 적용
 *    명령어: docker compose up -d
 * 
 * 4. pg_cron 스케줄러 등록 (Supabase SQL Editor에서 실행)
 *    select cron.schedule(
 *      'sync-expert-feeds-task',
 *      '0 * * * *', -- 매시간 정각
 *      $$ 
 *      select net.http_post(
 *        url := 'http://supabase-edge-functions:9000/sync-pipeline',
 *        headers := '{"Content-Type": "application/json"}'::jsonb
 *      )
 *      $$
 *    );
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const APP_URL = Deno.env.get('APP_URL');
  const CRON_SECRET_KEY = Deno.env.get('CRON_SECRET_KEY');

  console.log('--- 파이프라인 트리거 프로세스 시작 ---');
  console.log(`대상 서버: ${APP_URL}`);

  if (!APP_URL || !CRON_SECRET_KEY) {
    return new Response(
      JSON.stringify({ error: '필수 환경 변수(APP_URL, CRON_SECRET_KEY)가 설정되지 않았습니다.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const response = await fetch(`${APP_URL}/api/cron/sync`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CRON_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    console.log('트리거 결과:', result);

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
