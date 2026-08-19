'use client';

import { useState, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import { usePolling } from '@/hooks/usePolling';
import type { AiJob, AiJobStatus } from '@/types/ai-job';
import type { ApiResponse } from '@/types/api';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Status values exposed by the hook, extending AiJobStatus with 'idle' */
export type AIJobHookStatus = 'idle' | AiJobStatus;

export interface UseAIJobReturn {
  /** Current lifecycle status of the AI job */
  status: AIJobHookStatus;
  /** job_id returned after dispatching — null before first dispatch */
  jobId: string | null;
  /** Result text from a completed job — null otherwise */
  result: string | null;
  /** Error message from a failed job — null otherwise */
  error: string | null;
  /** True while the job is pending or processing */
  isLoading: boolean;
  /**
   * Trigger a new AI job.
   * @param endpoint  Full path to the trigger endpoint, e.g. `/api/resumes/{id}/ai/summary`
   * @param body      Optional request body (e.g. `{ company_name, position_name }`)
   */
  dispatch: (endpoint: string, body?: Record<string, unknown>) => Promise<void>;
  /** Reset hook state back to idle (useful when navigating away or retrying) */
  reset: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useAIJob — manages the full lifecycle of a single AI background job.
 *
 * Flow:
 *   1. `dispatch(endpoint, body)` — POST to trigger endpoint → receive job_id, set status=pending
 *   2. Poll `GET /api/ai/jobs/{jobId}` every 2 s while status is pending or processing
 *   3. On completed/failed — stop polling, populate result/error
 *
 * Requirements: 4.1, 4.9, 5.1, 6.1, 7.1, 11.2
 */
export function useAIJob(): UseAIJobReturn {
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<AIJobHookStatus>('idle');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ── Poll status ────────────────────────────────────────────────────────────

  const pollStatus = useCallback(async () => {
    if (!jobId) return;

    try {
      const { data: envelope } = await apiClient.get<ApiResponse<AiJob>>(
        `/api/ai/jobs/${jobId}`,
      );
      const job = envelope.data;

      setStatus(job.status);

      if (job.status === 'completed') {
        setResult(job.result);
      } else if (job.status === 'failed') {
        setError(job.error_message);
      }
    } catch {
      // Network errors during polling are swallowed — the interval will retry.
      // A persistent error will surface when the job itself transitions to 'failed'.
    }
  }, [jobId]);

  // Only poll while the job is in-flight; pass null to stop
  const isActive = status === 'pending' || status === 'processing';
  usePolling(pollStatus, isActive ? 2000 : null);

  // ── Dispatch ───────────────────────────────────────────────────────────────

  const dispatch = useCallback(
    async (endpoint: string, body?: Record<string, unknown>): Promise<void> => {
      // Reset any previous job state before starting a new one
      setJobId(null);
      setResult(null);
      setError(null);
      setStatus('pending');

      const { data: envelope } = await apiClient.post<
        ApiResponse<{ job_id: string; status: AiJobStatus }>
      >(endpoint, body ?? {});

      setJobId(envelope.data.job_id);
      setStatus(envelope.data.status ?? 'pending');
    },
    [],
  );

  // ── Reset ──────────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    setJobId(null);
    setStatus('idle');
    setResult(null);
    setError(null);
  }, []);

  return {
    status,
    jobId,
    result,
    error,
    isLoading: isActive,
    dispatch,
    reset,
  };
}
