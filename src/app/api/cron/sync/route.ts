/**
 * 크론(Cron) 작업을 통한 데이터 동기화 파이프라인 트리거 API 모듈입니다.
 */
import { NextResponse } from 'next/server';
import { runFullPipeline } from '@/features/sync-pipeline/model/pipeline';
import { env } from '@/shared/config/env';

/** API 실행 최대 시간 제한 (60초) */
export const maxDuration = 60; // 실행 시간 제한 연장 (Vercel 등의 환경 고려)

/**
 * 동기화 파이프라인을 실행하는 POST 핸들러입니다.
 * @param {Request} request HTTP 요청 객체
 * @returns {Promise<NextResponse>} 실행 결과 JSON 응답
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get('Authorization');

  // Supabase Service Role Key 또는 커스텀 키로 보안 검증
  // 여기서는 편의상 Authorization 헤더가 유효한지 확인하는 로직을 예시로 둡니다.
  if (authHeader !== `Bearer ${process.env.CRON_SECRET_KEY}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    await runFullPipeline();
    return NextResponse.json({ success: true, message: '파이프라인 실행 완료' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
