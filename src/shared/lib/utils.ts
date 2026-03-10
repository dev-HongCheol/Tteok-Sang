/**
 * 공통적으로 사용되는 유틸리티 함수들을 정의하는 모듈입니다.
 */
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Tailwind CSS 클래스들을 조건부로 결합하고 병합하는 유틸리티 함수입니다.
 * @param {...ClassValue[]} inputs 결합할 클래스 값들
 * @returns {string} 병합된 클래스 문자열
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
