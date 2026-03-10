/**
 * 전문가(Expert) 엔티티와 관련된 데이터 타입을 정의합니다.
 */

/** 전문가 정보 인터페이스 */
export interface Expert {
  /** 전문가 고유 ID (UUID) */
  id: string;
  /** 전문가의 트위터(X) 핸들 (예: @username) */
  twitter_handle: string;
  /** 전문가의 표시 이름 */
  name: string;
  /** 마지막 피드 동기화 일시 */
  last_synced_at: string | null;
  /** 생성 일시 */
  created_at: string;
}

/** 새로운 전문가 생성을 위한 데이터 타입 */
export type CreateExpert = Omit<Expert, 'id' | 'created_at'>;
/** 전문가 정보 수정을 위한 데이터 타입 */
export type UpdateExpert = Partial<CreateExpert>;
