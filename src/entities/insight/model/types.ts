export type ImportanceLevel = 'Low' | 'Medium' | 'High';

export interface Insight {
  id: string;
  feed_id: string;
  relevance_score: number;
  summary: string | null;
  importance: ImportanceLevel | null;
  category: string | null;
  created_at: string;
}

export type CreateInsight = Omit<Insight, 'id' | 'created_at'>;
