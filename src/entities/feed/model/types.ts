/**
 * 피드(Feed) 엔티티와 관련된 데이터 타입을 정의합니다.
 */

/** 전문가로부터 수집된 원본 피드 정보 인터페이스 */
export interface Feed {
  /** 피드 고유 ID (UUID) */
  id: string;
  /** 피드를 작성한 전문가 ID (FK) */
  expert_id: string;
  /** 트위터(X) 상의 원본 트윗 ID */
  tweet_id: string;
  /** 피드 원문 내용 */
  content: string;
  /** 원본 피드가 게시된 일시 */
  published_at: string;
  /** 수집된 원본 데이터 전체 (JSON) */
  raw_data: Record<string, any> | null;
  /** DB 저장 일시 */
  created_at: string;
}

/** 새로운 피드 생성을 위한 데이터 타입 */
export type CreateFeed = Omit<Feed, 'id' | 'created_at'>;
