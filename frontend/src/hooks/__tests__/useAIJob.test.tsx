import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { useAIJob } from '../useAIJob';
import apiClient from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedGet = apiClient.get as Mock;
const mockedPost = apiClient.post as Mock;

describe('useAIJob', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockedGet.mockReset();
    mockedPost.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('status awal idle', () => {
    const { result } = renderHook(() => useAIJob());

    expect(result.current.status).toBe('idle');
    expect(result.current.jobId).toBeNull();
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('dispatch mem-post ke endpoint dan menyimpan job_id', async () => {
    mockedPost.mockResolvedValueOnce({
      data: { data: { job_id: 'job-1', status: 'pending' } },
    });

    const { result } = renderHook(() => useAIJob());

    await act(async () => {
      await result.current.dispatch('/api/resumes/res-1/ai/summary');
    });

    expect(mockedPost).toHaveBeenCalledWith('/api/resumes/res-1/ai/summary', {});
    expect(result.current.jobId).toBe('job-1');
    expect(result.current.status).toBe('pending');
    expect(result.current.isLoading).toBe(true);
  });

  it('polling mengambil hasil saat job completed', async () => {
    mockedPost.mockResolvedValueOnce({
      data: { data: { job_id: 'job-2', status: 'pending' } },
    });
    mockedGet.mockResolvedValue({
      data: {
        data: { job_id: 'job-2', type: 'summary', status: 'completed', result: 'Ringkasan AI' },
      },
    });

    const { result } = renderHook(() => useAIJob());

    await act(async () => {
      await result.current.dispatch('/api/resumes/res-1/ai/summary');
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    await act(async () => {});

    expect(result.current.status).toBe('completed');
    expect(result.current.result).toBe('Ringkasan AI');
    expect(result.current.isLoading).toBe(false);

    // Polling berhenti setelah selesai — jumlah panggilan tidak bertambah lagi
    const callCountAfterComplete = mockedGet.mock.calls.length;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6000);
    });
    expect(mockedGet.mock.calls.length).toBe(callCountAfterComplete);
  });

  it('polling menangkap error_message saat job failed', async () => {
    mockedPost.mockResolvedValueOnce({
      data: { data: { job_id: 'job-3', status: 'processing' } },
    });
    mockedGet.mockResolvedValue({
      data: {
        data: {
          job_id: 'job-3',
          type: 'ats_score',
          status: 'failed',
          error_message: 'Provider AI sedang down',
        },
      },
    });

    const { result } = renderHook(() => useAIJob());

    await act(async () => {
      await result.current.dispatch('/api/resumes/res-1/ai/ats-score');
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    await act(async () => {});

    expect(result.current.status).toBe('failed');
    expect(result.current.error).toBe('Provider AI sedang down');
  });

  it('reset mengembalikan state ke idle', async () => {
    mockedPost.mockResolvedValueOnce({
      data: { data: { job_id: 'job-4', status: 'pending' } },
    });

    const { result } = renderHook(() => useAIJob());

    await act(async () => {
      await result.current.dispatch('/api/resumes/res-1/ai/cover-letter', {
        company_name: 'PT Maju',
        position_name: 'Frontend Dev',
      });
    });

    await act(async () => {
      result.current.reset();
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.jobId).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('dispatch mengirim body yang diberikan', async () => {
    mockedPost.mockResolvedValueOnce({
      data: { data: { job_id: 'job-5', status: 'pending' } },
    });

    const { result } = renderHook(() => useAIJob());
    const body = { experience_id: 'exp-9' };

    await act(async () => {
      await result.current.dispatch('/api/resumes/res-1/experiences/exp-9/ai/rewrite', body);
    });

    expect(mockedPost).toHaveBeenCalledWith(
      '/api/resumes/res-1/experiences/exp-9/ai/rewrite',
      body,
    );
  });
});
