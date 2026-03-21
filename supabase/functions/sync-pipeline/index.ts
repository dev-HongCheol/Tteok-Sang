import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Parser from 'npm:rss-parser';

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  },
});

/** 가용한 Nitter 인스턴스 (사용자 요청에 따라 nitter.net 단일 사용) */
const NITTER_URL = 'https://nitter.net';

serve(async (req) => {
  const APP_URL = 'https://tteok-sang.vercel.app';
  const CRON_SECRET_KEY = Deno.env.get('CRON_SECRET_KEY');

  // 1. 요청 파싱
  const body = await req.json().catch(() => ({}));
  const { handle } = body;

  // Case A: 전문가 핸들이 있는 경우 -> RSS 수집 모드 (Vercel에서 호출함)
  if (handle) {
    console.log(`[RSS Fetch Mode] ${handle} 수집 시도...`);
    try {
      const rssUrl = `${NITTER_URL}/${handle}/rss`;
      const feed = await parser.parseURL(rssUrl);

      if (feed && feed.items) {
        const feeds = feed.items.map((item) => ({
          ...item,
          tweetId: item.guid?.split('/').pop()?.split('#')[0] || '',
        }));
        return new Response(JSON.stringify({ feeds }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
      throw new Error('피드 데이터를 찾을 수 없습니다.');
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // Case B: 핸들이 없는 경우 -> 파이프라인 트리거 모드 (pg_cron에서 호출함)
  console.log(`[Pipeline Trigger Mode] Vercel 파이프라인 깨우는 중...`);
  if (!APP_URL || !CRON_SECRET_KEY) {
    return new Response(JSON.stringify({ error: 'Server config missing' }), { status: 500 });
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
    return new Response(JSON.stringify(result), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: `Trigger failed: ${error.message}` }), {
      status: 500,
    });
  }
});
