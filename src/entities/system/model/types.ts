/**
 * 시스템(System) 관리 및 파이프라인 로그와 관련된 데이터 타입을 정의합니다.
 */

/** 시스템 설정 정보 인터페이스 */
export interface SystemSetting {
  /** 설정 키 */
  key: string;
  /** 설정 값 */
  value: string;
  /** 마지막 업데이트 일시 */
  updated_at: string;
}

/** 파이프라인 처리 상태 타입 */
export type PipelineStatus = '완료' | '수집 오류' | '분석 오류' | '시스템 오류' | '진행중' | 'success' | 'error';

/** 동기화 파이프라인 실행 로그 인터페이스 */
export interface PipelineLog {
  /** 로그 고유 ID (UUID) */
  id: string;
  /** 실행 시작 일시 */
  started_at: string;
  /** 실행 종료 일시 */
  ended_at: string | null;
  /** 실행 상태 */
  status: PipelineStatus | null;
  /** 수집된 피드 수 */
  collected_count: number;
  /** 분석된 인사이트 수 */
  analyzed_count: number;
  /** 오류 발생 시 메시지 */
  error_message: string | null;
  /** DB 기록 일시 */
  created_at: string;
}

/** 파이프라인 로그 생성을 위한 데이터 타입 */
export type CreatePipelineLog = Omit<PipelineLog, 'id' | 'created_at'>;
/** 파이프라인 로그 업데이트를 위한 데이터 타입 */
export type UpdatePipelineLog = Partial<Omit<PipelineLog, 'id' | 'created_at' | 'started_at'>>;
