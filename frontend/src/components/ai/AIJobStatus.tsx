'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { AIJobHookStatus } from '@/hooks/useAIJob';

export interface AIJobStatusProps {
  status: AIJobHookStatus;
  result?: string | null;
  error?: string | null;
}

/**
 * Renders the current state of an AI job:
 * - idle:               nothing
 * - pending/processing: animated spinner + "Sedang memproses..."
 * - completed:          result text in a card
 * - failed:             destructive Alert with the error message
 */
export function AIJobStatus({ status, result, error }: AIJobStatusProps) {
  if (status === 'idle') {
    return null;
  }

  if (status === 'pending' || status === 'processing') {
    return (
      <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
        {/* Spinner */}
        <svg
          className="h-5 w-5 animate-spin text-primary"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <span>Sedang memproses...</span>
      </div>
    );
  }

  if (status === 'completed' && result) {
    return (
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Hasil AI
        </p>
        <pre className="whitespace-pre-wrap break-words text-sm text-card-foreground">
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
