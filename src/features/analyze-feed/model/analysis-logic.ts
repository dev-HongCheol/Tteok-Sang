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

// AI 배치 응답 스키마 (배열)
export const batchAnalysisResponseSchema = z.array(individualAnalysisSchema);

export type AnalysisResponse = z.infer<typeof individualAnalysisSchema>;

// AI 배치 분석 시 권장되는 피드당 최대 텍스트 길이
const MAX_CONTENT_LENGTH = 1000;

/**
 * 여러 트윗 피드를 한꺼번에 분석하여 인사이트를 도출하고 DB에 저장합니다. (Batch Processing)
 * Gemini 무료 티어의 RPM 제한을 준수하기 위해 최대 10개 단위로 호출할 것을 권장합니다.
 */
export const analyzeFeedsBatch = async (feeds: Feed[]): Promise<AnalysisResponse[]> => {
  if (feeds.length === 0) return [];

  const feedContents = feeds
    .map((f) => {
      // 내용이 너무 길면 토큰 절약을 위해 자름
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
       - relevance_score: 경제, 산업, 거시경제 지표와의 관련성을 0~100 사이의 숫자로 매기세요.
       - summary: 관련성이 높은 경우 3줄 내외의 핵심 요약을 작성하세요. 관련성이 낮다면 핵심 내용을 아주 짧게 기술하세요.
       - importance: 정보의 중요도를 'Low', 'Medium', 'High' 중 하나로 선택하세요.
       - category: '거시경제', '반도체', '2차전지', '인공지능', '바이오', '자동차', '에너지', '로봇', '코인', '부동산', '기타' 중 하나를 선택하세요.
    2. 경제/주식과 전혀 관련 없는 일상적인 내용이라면 category를 '기타'로 분류하고 relevance_score를 낮게 책정하세요.
    3. 반드시 모든 트윗에 대해 분석 결과를 포함한 JSON 배열 형태로만 응답하세요. (형식: [{"feed_id": "...", ...}, ...])

    반드시 JSON 배열 형식으로만 응답하세요.
  `;

  try {
    const result = await geminiModel.generateContent(prompt);
    const responseText = result.response.text();

    // JSON 응답 파싱 및 검증
    const jsonResponse = JSON.parse(responseText);
    const validatedBatchData = batchAnalysisResponseSchema.parse(jsonResponse);

    // 분석 결과를 ts_insights 테이블에 대량 저장 (Batch Insert)
    const insightsToInsert = validatedBatchData.map((data) => ({
      feed_id: data.feed_id,
      relevance_score: data.relevance_score,
      summary: data.summary,
      importance: data.importance,
      category: data.category,
    }));

    const { error: insertError } = await supabase.from('ts_insights').insert(insightsToInsert);

    if (insertError) {
      console.error('인사이트 배치 저장 중 오류 발생:', insertError.message);
    }

    return validatedBatchData;
  } catch (error) {
    console.error('AI 배치 분석 중 오류가 발생했습니다:', error);
    throw error;
  }
};
