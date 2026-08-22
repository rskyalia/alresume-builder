import { describe, expect, it, vi, beforeEach, type Mock } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ExperienceRewriteConfirm } from '../ExperienceRewriteConfirm';
import apiClient from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({
  default: {
    post: vi.fn(),
  },
}));

const mockedPost = apiClient.post as Mock;

describe('ExperienceRewriteConfirm', () => {
  const defaultProps = {
    resumeId: 'res-1',
    experienceId: 'exp-1',
    result: 'Deskripsi hasil AI.',
    onConfirmed: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    mockedPost.mockReset();
  });

  it('menampilkan draft hasil AI di textarea', () => {
    render(<ExperienceRewriteConfirm {...defaultProps} />);

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue('Deskripsi hasil AI.');
  });

  it('menyimpan ke endpoint confirm (plural experiences) saat Simpan diklik', async () => {
    const user = userEvent.setup();
    mockedPost.mockResolvedValueOnce({ data: { data: {} } });
    const onConfirmed = vi.fn();

    render(<ExperienceRewriteConfirm {...defaultProps} onConfirmed={onConfirmed} />);

    await user.click(screen.getByRole('button', { name: 'Simpan' }));

    expect(mockedPost).toHaveBeenCalledWith(
      '/api/resumes/res-1/experiences/exp-1/ai/rewrite/confirm',
      { description_text: 'Deskripsi hasil AI.' },
    );
    await expect(
      vi.waitFor(() => expect(onConfirmed).toHaveBeenCalledWith('Deskripsi hasil AI.')),
    ).resolves.not.toThrow();
  });

  it('menyimpan teks yang sudah diedit pengguna', async () => {
    const user = userEvent.setup();
    mockedPost.mockResolvedValueOnce({ data: { data: {} } });

    render(<ExperienceRewriteConfirm {...defaultProps} />);

    await user.clear(screen.getByRole('textbox'));
    await user.type(screen.getByRole('textbox'), 'Teks revisi manual.');

    await user.click(screen.getByRole('button', { name: 'Simpan' }));

    await vi.waitFor(() =>
      expect(mockedPost).toHaveBeenCalledWith(expect.any(String), {
        description_text: 'Teks revisi manual.',
      }),
    );
  });

  it('tombol Simpan disabled saat teks kosong', () => {
    render(<ExperienceRewriteConfirm {...defaultProps} result="" />);

    expect(screen.getByRole('button', { name: 'Simpan' })).toBeDisabled();
  });

  it('menampilkan pesan error dari API saat gagal menyimpan', async () => {
    const user = userEvent.setup();
    mockedPost.mockRejectedValueOnce({
      response: { data: { message: 'Sesi berakhir. Silakan login ulang.' } },
    });

    render(<ExperienceRewriteConfirm {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'Simpan' }));

    expect(await screen.findByText('Sesi berakhir. Silakan login ulang.')).toBeInTheDocument();
  });

  it('memanggil onCancel saat Batal diklik', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(<ExperienceRewriteConfirm {...defaultProps} onCancel={onCancel} />);

    await user.click(screen.getByRole('button', { name: 'Batal' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(mockedPost).not.toHaveBeenCalled();
  });
});
