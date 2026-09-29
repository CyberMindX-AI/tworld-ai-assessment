// ─── Types ───────────────────────────────────────────────────────────────────

export interface GeneratePostOutput {
  short: string;
  long: string;
  bullets: string[];
}

export interface ImprovePostOutput {
  content: string;
}

export interface HashtagOutput {
  hashtags: string[];
}

export interface MediaRecommendation {
  fileId: string;
  filename: string;
  relevanceScore: number;
  reason: string;
}

export interface RecommendMediaOutput {
  recommendations: MediaRecommendation[];
}

export type PostMode = 'short' | 'long' | 'bullets';
export type ImproveInstruction = 'improve' | 'rewrite' | 'shorten' | 'expand';
export type FileStatus = 'initiated' | 'scanning' | 'approved' | 'rejected';
export type FileType = 'image' | 'video' | 'document' | 'other';
