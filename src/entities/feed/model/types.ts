export interface Feed {
  id: string;
  expert_id: string;
  tweet_id: string;
  content: string;
  published_at: string;
  raw_data: Record<string, any> | null;
  created_at: string;
}

export type CreateFeed = Omit<Feed, 'id' | 'created_at'>;
