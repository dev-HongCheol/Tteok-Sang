import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Parser from "npm:rss-parser";

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  },
});

/** 가용한 Nitter 인스턴스 (사용자 요청에 따라 nitter.net 단일 사용) */
const NITTER_URL = 'https://nitter.net';

serve(async (req) => {
  // 1. 요청 파싱
  const { handle } = await req.json();
  if (!handle) {
    return new Response(JSON.stringify({ error: "Handle is required" }), { 
      status: 400, 
      headers: { "Content-Type": "application/json" } 
    });
  }

  console.log(`[Edge Function] ${handle} 수집 시작 (Target: ${NITTER_URL})`);

  try {
    const rssUrl = `${NITTER_URL}/${handle}/rss`;
    console.log(`[RSS 시도] ${rssUrl}`);
    
    const feed = await parser.parseURL(rssUrl);
    
    if (feed && feed.items) {
      const feeds = feed.items.map(item => ({
        ...item,
        tweetId: item.guid?.split('/').pop()?.split('#')[0] || '',
      }));
      console.log(`[수집 성공] ${feeds.length}개 발견`);
      
      return new Response(JSON.stringify({ feeds }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    
    throw new Error("피드 데이터를 찾을 수 없습니다.");
  } catch (error) {
    console.error(`[수집 실패] ${error.message}`);
    return new Response(JSON.stringify({ 
      error: `수집 실패: ${error.message}` 
    }), { 
      status: 500, 
      headers: { "Content-Type": "application/json" } 
    });
  }
});
