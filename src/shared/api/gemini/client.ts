import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '@/shared/config/env';

// Gemini API 초기화
const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

// 분석을 위한 기본 모델 (Gemini 2.0 Flash)
// JSON 모드 사용을 위해 응답 형식을 설정할 수 있습니다.
export const geminiModel = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
  generationConfig: {
    responseMimeType: 'application/json',
  },
});
