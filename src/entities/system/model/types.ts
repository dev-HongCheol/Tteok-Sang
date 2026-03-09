export interface SystemSetting {
  key: string;
  value: string;
  updated_at: string;
}

export interface PipelineLog {
  id: string;
  started_at: string;
  ended_at: string | null;
  status: 'success' | 'error' | null;
  collected_count: number;
  analyzed_count: number;
  error_message: string | null;
  created_at: string;
}

export type CreatePipelineLog = Omit<PipelineLog, 'id' | 'created_at'>;
export type UpdatePipelineLog = Partial<Omit<PipelineLog, 'id' | 'created_at' | 'started_at'>>;
