'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAIJob } from '@/hooks/useAIJob';
import { AIJobStatus } from '@/components/ai/AIJobStatus';
import { copyToClipboard } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

// ─── Validation schema ────────────────────────────────────────────────────────

const coverLetterFormSchema = z.object({
  company_name: z.string().min(1, 'Nama perusahaan tidak boleh kosong').max(200),
  position_name: z.string().min(1, 'Nama posisi tidak boleh kosong').max(200),
});

type CoverLetterFormValues = z.infer<typeof coverLetterFormSchema>;

/**
 * Pesan progres khusus pembuatan cover letter.
 * "Sedang memproses..." harus tetap menjadi pesan pertama (dipakai test).
 */
const COVER_LETTER_LOADING_MESSAGES = [
  'Sedang memproses...',
  'Membaca ringkasan dan pengalaman Anda...',
  'Menyesuaikan surat dengan perusahaan dan posisi...',
  'Menulis paragraf pembuka yang menarik...',
  'Memfinalisikan cover letter Anda...',
];

// ─── Props ────────────────────────────────────────────────────────────────────

export interface CoverLetterEditorProps {
  resumeId: string;
}

/**
 * Cover Letter generator panel.
 *
 * 1. User fills in company_name and position_name
 * 2. Submitting dispatches an AI job via useAIJob
 * 3. AIJobStatus shows progress
 * 4. When completed, result is shown in an editable textarea
 * 5. Copy-to-clipboard button available when result is ready
 *
 * Requirements: 7.4
 */
export function CoverLetterEditor({ resumeId }: CoverLetterEditorProps) {
  const { status, result, error, dispatch, reset } = useAIJob();
  const [editedResult, setEditedResult] = useState<string>('');
  // null = belum pernah menyalin, true/false = hasil percobaan terakhir
  const [copySuccess, setCopySuccess] = useState<boolean | null>(null);
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CoverLetterFormValues>({
    resolver: zodResolver(coverLetterFormSchema),
  });

  const onSubmit = async (values: CoverLetterFormValues) => {
    reset();
    setEditedResult('');
    setCopySuccess(null);
    setDispatchError(null);

    try {
      await dispatch(`/api/resumes/${resumeId}/ai/cover-letter`, {
        company_name: values.company_name,
        position_name: values.position_name,
      });
    } catch {
      // POST pemicu gagal — reset agar tidak berhenti di spinner.
      reset();
      setDispatchError(
        'Gagal memulai pembuatan cover letter. Periksa kuota harian Anda lalu coba lagi.',
      );
    }
  };

  // Sync editedResult when job completes
  // When the job completes, initialise the editable textarea with the AI result
  useEffect(() => {
    if (status === 'completed' && result) {
      setEditedResult(result);
    }
  }, [status, result]);

  const displayResult = editedResult || result || '';

  const handleCopy = async () => {
    if (!displayResult) return;
    const succeeded = await copyToClipboard(displayResult);
    setCopySuccess(succeeded);
    if (succeeded) {
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="company_name" className="text-sm font-medium text-foreground">
            Nama Perusahaan
          </label>
          <Input
            id="company_name"
            placeholder="Contoh: PT. Tokopedia"
            {...register('company_name')}
            disabled={isSubmitting || status === 'pending' || status === 'processing'}
          />
          {errors.company_name && (
            <p className="text-xs text-destructive">{errors.company_name.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="position_name" className="text-sm font-medium text-foreground">
            Nama Posisi
          </label>
          <Input
            id="position_name"
            placeholder="Contoh: Backend Engineer"
            {...register('position_name')}
            disabled={isSubmitting || status === 'pending' || status === 'processing'}
          />
          {errors.position_name && (
            <p className="text-xs text-destructive">{errors.position_name.message}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting || status === 'pending' || status === 'processing'}
          className={
            status === 'pending' || status === 'processing'
              ? ''
              : 'gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-fuchsia-500/20 transition-all hover:opacity-90 hover:shadow-lg hover:shadow-fuchsia-500/30'
          }
        >
          {status === 'pending' || status === 'processing'
            ? 'Sedang Membuat...'
            : 'Buat Cover Letter'}
        </Button>
      </form>

      {/* Job status (spinner / error) — hide completed here, we show custom result below */}
      {(status === 'pending' || status === 'processing' || status === 'failed') && (
        <AIJobStatus
          status={status}
          error={error}
          loadingMessages={COVER_LETTER_LOADING_MESSAGES}
        />
      )}

      {dispatchError && (
        <Alert variant="destructive">
          <AlertDescription>{dispatchError}</AlertDescription>
        </Alert>
      )}

      {/* Result editor */}
      {status === 'completed' && displayResult && (
        <div className="animate-fade-in-up space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Hasil Cover Letter</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
            >
              {copySuccess ? '✓ Tersalin!' : 'Salin ke Clipboard'}
            </Button>
          </div>

          <Textarea
            value={displayResult}
            onChange={(e) => setEditedResult(e.target.value)}
            rows={16}
            className="resize-y font-mono text-sm"
            placeholder="Hasil cover letter akan muncul di sini..."
          />

          {copySuccess && (
            <Alert>
              <AlertDescription>
                Teks berhasil disalin ke clipboard.
              </AlertDescription>
            </Alert>
          )}

          {copySuccess === false && (
            <Alert variant="destructive">
              <AlertDescription>
                Gagal menyalin. Silakan salin manual dari teks di atas.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}
