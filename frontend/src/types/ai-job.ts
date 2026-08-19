/**
 * TypeScript types for AI job entities.
 */

export type AiJobType =
  | 'summary'
  | 'experience_rewrite'
  | 'ats_score'
  | 'cover_letter';

export type AiJobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface AiJob {
  id: string;
  user_id: string;
  resume_id: string;
  type: AiJobType;
  status: AiJobStatus;
  payload: Record<string, unknown> | null;
  result: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}
