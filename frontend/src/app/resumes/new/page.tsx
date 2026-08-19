'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import apiClient from '@/lib/api-client';
import type { Resume } from '@/types/resume';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

type PageState =
  | { status: 'creating' }
  | { status: 'credit_error' }
  | { status: 'error'; message: string };

export default function NewResumePage() {
  const router = useRouter();
  const [state, setState] = useState<PageState>({ status: 'creating' });

  async function createResume() {
    setState({ status: 'creating' });
    try {
      const res = await apiClient.post<{ data: Resume }>('/api/resumes', {
        title: 'Resume Baru',
      });
      router.push(`/resumes/${res.data.data.id}`);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 403) {
        setState({ status: 'credit_error' });
      } else {
        const message =
          (err as { response?: { data?: { message?: string } } })?.response?.data
            ?.message ?? 'Terjadi kesalahan. Silakan coba lagi.';
        setState({ status: 'error', message });
      }
    }
  }

  // Trigger creation on mount
  useEffect(() => {
    createResume();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state.status === 'creating') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Membuat resume baru...</p>
        </div>
      </div>
    );
  }

  if (state.status === 'credit_error') {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-4">
          <Alert variant="destructive">
            <AlertTitle>Kredit resume habis</AlertTitle>
            <AlertDescription>
              Kamu sudah menggunakan semua kredit resume gratis. Silakan upgrade ke
              Pro untuk membuat resume tanpa batas.
            </AlertDescription>
          </Alert>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              Kembali ke Dashboard
            </Button>
            <Button onClick={() => router.push('/dashboard')}>
              Upgrade ke Pro
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // generic error state
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4">
        <Alert variant="destructive">
          <AlertTitle>Gagal membuat resume</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            Kembali ke Dashboard
          </Button>
          <Button onClick={createResume}>Coba Lagi</Button>
        </div>
      </div>
    </div>
  );
}
