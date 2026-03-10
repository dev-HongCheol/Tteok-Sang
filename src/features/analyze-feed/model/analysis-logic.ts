import { z } from 'zod';
import type { Feed } from '@/entities/feed/model/types';
import { geminiModel } from '@/shared/api/gemini/client';
import { supabase } from '@/shared/api/supabase/client';

// AI 개별 응답 스키마
const individualAnalysisSchema = z.object({
  feed_id: z.string(),
  relevance_score: z.number().min(0).max(100),
  summary: z.string().nullable(),
  importance: z.enum(['Low', 'Medium', 'High']).nullable(),
  category: z.string().nullable(),
});

export const batchAnalysisResponseSchema = z.array(individualAnalysisSchema);
export type AnalysisResponse = z.infer<typeof individualAnalysisSchema>;

const MAX_CONTENT_LENGTH = 1000;

/**
 * 여러 트윗 피드를 한꺼번에 분석하여 인사이트를 도출하고 DB에 저장합니다.
 */
export const analyzeFeedsBatch = async (feeds: Feed[]): Promise<AnalysisResponse[]> => {
  if (feeds.length === 0) return [];

  const feedContents = feeds
    .map((f) => {
      const truncatedContent =
        f.content.length > MAX_CONTENT_LENGTH
          ? `${f.content.slice(0, MAX_CONTENT_LENGTH)}...`
          : f.content;
      return `[ID: ${f.id}] [Content: ${truncatedContent}]`;
    })
    .join('\n---\n');

  const prompt = `
    당신은 숙련된 금융 전문가이자 경제 뉴스 큐레이터입니다. 
    다음 제공되는 ${feeds.length}개의 트윗 리스트를 분석하여 각각 경제/주식 시장과의 관련성을 평가하고 핵심 요약을 작성하세요.

    [트윗 리스트]
    ${feedContents}

    [분석 가이드라인]
    1. 각 트윗에 대해 다음 정보를 추출하세요:
       - feed_id: 제공된 ID를 그대로 사용하세요.
       - relevance_score: 0~100 사이의 숫자.
       - summary: 관련성이 높은 경우 3줄 내외의 핵심 요약. 낮으면 짧게 기술.
       - importance: 'Low', 'Medium', 'High' 중 하나.
       - category: '거시경제', '반도체', '2차전지', '인공지능', '바이오', '자동차', '에너지', '로봇', '코인', '부동산', '증권', '방산', '조선', '기타' 중 하나.
    2. 반드시 모든 트윗에 대해 분석 결과를 포함한 JSON 배열 형태로만 응답하세요. (형식: [{"feed_id": "...", ...}, ...])
  `;
  console.log('🚀 ~ analyzeFeedsBatch ~ prompt:', prompt);

  try {
    // 재시도 없이 직접 호출
    const result = await geminiModel.generateContent(prompt);
    const responseText = result.response.text();

    // JSON 응답 추출
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    const cleanJson = jsonMatch ? jsonMatch[0] : responseText;

    const jsonResponse = JSON.parse(cleanJson);
    const validatedBatchData = batchAnalysisResponseSchema.parse(jsonResponse);

    const insightsToInsert = validatedBatchData.map((data) => ({
      feed_id: data.feed_id,
      relevance_score: data.relevance_score,
      summary: data.summary,
      importance: data.importance,
      category: data.category,
    }));

    const { error: insertError } = await supabase.from('ts_insights').insert(insightsToInsert);
    if (insertError) throw new Error(`DB 저장 실패: ${insertError.message}`);

    return validatedBatchData;
  } catch (error: any) {
    // 에러를 처리하지 않고 그대로 던져서 파이프라인 로그에 기록되게 함
    throw error;
  }
};
