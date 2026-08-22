import { describe, expect, it, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ExperienceForm } from '../ExperienceForm';
import apiClient from '@/lib/api-client';
import type { Experience } from '@/types/resume';

vi.mock('@/lib/api-client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedGet = apiClient.get as Mock;
const mockedPost = apiClient.post as Mock;

const entries: Experience[] = [
  {
    id: 'exp-kerja-1',
    resume_id: 'res-1',
    experience_type: 'kerja',
    company: 'PT Maju',
    position: 'Frontend Developer',
    start_date: '2023-01-01',
    end_date: null,
    is_current: true,
    description: 'Membangun komponen UI.',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'exp-lomba-1',
    resume_id: 'res-1',
    experience_type: 'lomba',
    company: '',
    position: 'Hacknas 2024',
    start_date: '2024-03-01',
    end_date: null,
    is_current: false,
    description: 'Juara 2 nasional.',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'exp-kerja-2',
    resume_id: 'res-1',
    experience_type: 'kerja',
    company: 'PT Baru',
    position: 'Magang Backend',
    start_date: '2022-01-01',
    end_date: '2022-06-30',
    is_current: false,
    description: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

function mockListLoad() {
  mockedGet.mockImplementation(async (url: string) => {
    if (url === '/api/resumes/res-1/experience') {
      return { data: { data: { experience: entries } } };
    }
    throw new Error(`Unexpected GET ${url}`);
  });
}

describe('ExperienceForm — integrasi AI Rewrite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('menampilkan tombol AI Rewrite hanya untuk entri kerja, disabled bila tanpa deskripsi', async () => {
    mockListLoad();
    render(<ExperienceForm resumeId="res-1" />);

    // Dua entri kerja: Frontend Developer (ada deskripsi) dan Magang Backend (tanpa)
    const buttons = await screen.findAllByRole('button', { name: /ai rewrite/i });
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toBeEnabled();
    expect(buttons[1]).toBeDisabled();

    // Entri lomba tidak punya tombol AI Rewrite
    const lombaEdit = screen.getByRole('button', {
      name: 'Edit pengalaman Hacknas 2024',
    });
    const lombaCard = lombaEdit.closest('li');
    expect(
      Array.from(lombaCard!.querySelectorAll('button')).some((b) =>
        b.textContent?.includes('AI Rewrite'),
      ),
    ).toBe(false);
  });

  it('tombol AI Rewrite disabled untuk entri tanpa deskripsi', async () => {
    mockListLoad();
    render(<ExperienceForm resumeId="res-1" />);

    const magangEdit = await screen.findByRole('button', {
      name: 'Edit pengalaman Magang Backend',
    });

    // Tombol AI Rewrite berada di kartu yang sama dengan tombol edit Magang Backend
    const card = magangEdit.closest('li');
    expect(card).not.toBeNull();

    const rewriteButtonInCard = Array.from(
      card!.querySelectorAll('button'),
    ).find((b) => b.textContent?.includes('AI Rewrite'));
    expect(rewriteButtonInCard).toBeDefined();
    expect(rewriteButtonInCard).toBeDisabled();
  });

  it('klik AI Rewrite mem-post ke endpoint plural dan menampilkan status proses', async () => {
    mockListLoad();
    mockedPost.mockResolvedValueOnce({
      data: { data: { job_id: 'job-1', status: 'pending' } },
    });

    const user = userEvent.setup();
    render(<ExperienceForm resumeId="res-1" />);

    // Klik tombol AI Rewrite pada entri pertama (Frontend Developer, ada deskripsi)
    const buttons = await screen.findAllByRole('button', { name: /ai rewrite/i });
    await user.click(buttons[0]);

    await waitFor(() => {
      expect(mockedPost).toHaveBeenCalledWith(
        '/api/resumes/res-1/experiences/exp-kerja-1/ai/rewrite',
        {},
      );
    });

    expect(await screen.findByText('Sedang memproses...')).toBeInTheDocument();
  });

  it('menampilkan pesan error dari API saat dispatch ditolak (mis. kuota habis)', async () => {
    mockListLoad();
    mockedPost.mockRejectedValueOnce({
      response: { data: { message: 'Kuota harian AI telah habis.' } },
    });

    const user = userEvent.setup();
    render(<ExperienceForm resumeId="res-1" />);

    const buttons = await screen.findAllByRole('button', { name: /ai rewrite/i });
    await user.click(buttons[0]);

    expect(await screen.findByText('Kuota harian AI telah habis.')).toBeInTheDocument();
  });
});
