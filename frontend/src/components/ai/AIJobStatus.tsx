'use client';

import { Sparkles } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AIGeneratingState } from '@/components/ai/AIGeneratingState';
import type { AIJobHookStatus } from '@/hooks/useAIJob';

export interface AIJobStatusProps {
  status: AIJobHookStatus;
  result?: string | null;
  error?: string | null;
  /** Pesan progres khusus fitur saat job sedang berjalan. */
  loadingMessages?: string[];
}

/**
 * Renders the current state of an AI job:
 * - idle:               nothing
 * - pending/processing: AIGeneratingState (animated orb + rotating messages + skeleton)
 * - completed:          result text in a card
 * - failed:             destructive Alert with the error message
 */
export function AIJobStatus({ status, result, error, loadingMessages }: AIJobStatusProps) {
  if (status === 'idle') {
    return null;
  }

  if (status === 'pending' || status === 'processing') {
    return <AIGeneratingState messages={loadingMessages} />;
  }

  if (status === 'completed' && result) {
    return (
      <div className="animate-fade-in-up rounded-xl border bg-card p-4 shadow-sm sm:p-5">
        <div className="mb-2 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-tr from-violet-500/15 via-fuchsia-500/15 to-sky-500/15">
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          </span>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Hasil AI
          </p>
        </div>
        <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-card-foreground">
          {result}
        </pre>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <Alert variant="destructive">
        <AlertTitle>Gagal memproses</AlertTitle>
        <AlertDescription>
          {error ?? 'Terjadi kesalahan saat memproses permintaan AI. Silakan coba lagi.'}
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
