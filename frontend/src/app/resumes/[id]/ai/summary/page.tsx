'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Sparkles, RefreshCw } from 'lucide-react';

import { useAIJob } from '@/hooks/useAIJob';
import { AIJobStatus } from '@/components/ai/AIJobStatus';
import { AISummaryConfirm } from '@/components/ai/AISummaryConfirm';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * AI Summary page — triggers AI summary generation for a resume,
 * shows progress via AIJobStatus, then presents AISummaryConfirm
 * for the user to review/edit before saving.
 *
 * Requirements: 4.4, 4.5
 */
export default function AISummaryPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { status, result, error, dispatch, reset } = useAIJob();
  const [confirmed, setConfirmed] = useState(false);
  const [savedText, setSavedText] = useState<string | null>(null);

  const handleGenerate = async () => {
    setConfirmed(false);
    setSavedText(null);
    await dispatch(`/api/resumes/${id}/ai/summary`);
  };

  const handleConfirmed = (text: string) => {
    setSavedText(text);
    setConfirmed(true);
  };

  const handleRegenerate = () => {
    reset();
    setConfirmed(false);
    setSavedText(null);
  };

  const isInFlight = status === 'pending' || status === 'processing';

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/resumes/${id}`} aria-label="Kembali ke Resume Builder">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
        <h1 className="text-xl font-semibold text-foreground">AI Summary</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        Buat ringkasan profil profesional otomatis berdasarkan data resume Anda.
        Anda dapat mengedit hasilnya sebelum menyimpan.
      </p>

      {confirmed && savedText && (
        <Alert>
          <AlertDescription className="text-green-700 dark:text-green-400">
            Ringkasan berhasil disimpan ke profil.
          </AlertDescription>
        </Alert>
      )}

      {(status === 'idle' || status === 'failed') && !confirmed && (
        <Button onClick={handleGenerate} disabled={isInFlight} className="gap-2">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          Generate AI Summary
        </Button>
      )}

      {confirmed && (
        <Button onClick={handleRegenerate} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Buat Ulang Summary
        </Button>
      )}

      {(isInFlight || status === 'failed') && (
        <AIJobStatus status={status} error={error} />
      )}

      {status === 'completed' && result && !confirmed && (
        <AISummaryConfirm
          resumeId={id}
          result={result}
          onConfirmed={handleConfirmed}
          onCancel={handleRegenerate}
        />
      )}
    </div>
  );
}