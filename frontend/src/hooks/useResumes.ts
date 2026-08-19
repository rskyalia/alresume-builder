'use client';

import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import type { Resume } from '@/types/resume';
import type { ApiResponse } from '@/types/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ResumeUserInfo {
  plan: 'free' | 'pro';
  resume_credits: number;
}

interface ResumesApiData {
  resumes: Resume[];
  plan: string;
  resume_credits: number;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useResumes — manages the dashboard resume list and user credit info.
 *
 * Exposes:
 *   - resumes        — array of Resume objects owned by the current user
 *   - user           — plan and resume_credits for the current user
 *   - isLoading      — true while the initial fetch is in-flight
 *   - deleteResume   — DELETE /api/resumes/{id} and update local state
 *   - createResume   — POST /api/resumes and return the new Resume
 */
export function useResumes() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [user, setUser] = useState<ResumeUserInfo>({ plan: 'free', resume_credits: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // ── Fetch on mount ────────────────────────────────────────────────────────

  const fetchResumes = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: envelope } = await apiClient.get<ApiResponse<ResumesApiData>>(
        '/api/resumes',
      );
      setResumes(envelope.data.resumes ?? []);
      setUser({
        plan: (envelope.data.plan as 'free' | 'pro') ?? 'free',
        resume_credits: envelope.data.resume_credits ?? 0,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  // ── Delete ────────────────────────────────────────────────────────────────

  const deleteResume = useCallback(async (id: string): Promise<void> => {
    await apiClient.delete(`/api/resumes/${id}`);
    setResumes((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // ── Create ────────────────────────────────────────────────────────────────

  const createResume = useCallback(
    async (title: string = 'Untitled Resume'): Promise<Resume> => {
      const { data: envelope } = await apiClient.post<ApiResponse<{ resume: Resume }>>(
        '/api/resumes',
        { title, template: 'default' },
      );

      const newResume = envelope.data.resume ?? (envelope.data as unknown as Resume);
      setResumes((prev) => [newResume, ...prev]);

      // Decrement credit optimistically for free users
      setUser((prev) => ({
        ...prev,
        resume_credits:
          prev.plan === 'free'
            ? Math.max(0, prev.resume_credits - 1)
            : prev.resume_credits,
      }));

      return newResume;
    },
    [],
  );

  return { resumes, user, isLoading, deleteResume, createResume, refetch: fetchResumes };
}
