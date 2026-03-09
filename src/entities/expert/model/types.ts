export interface Expert {
  id: string;
  twitter_handle: string;
  name: string;
  last_synced_at: string | null;
  created_at: string;
}

export type CreateExpert = Omit<Expert, 'id' | 'created_at'>;
export type UpdateExpert = Partial<CreateExpert>;
