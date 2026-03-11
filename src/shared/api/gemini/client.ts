/**
 * Google Gemini AI 클라이언트 인스턴스를 관리하는 모듈입니다.
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '@/shared/config/env';

// Gemini API 초기화
const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

/**
 * 분석을 위한 기본 모델 (Gemini 2.5 Flash)
 * JSON 모드 사용을 위해 응답 형식이 application/json으로 설정되어 있습니다.
 */
export const geminiModel = genAI.getGenerativeModel({
  model: 'gemini-3.1-flash-lite-preview',
  generationConfig: {
    responseMimeType: 'application/json',
  },
});
