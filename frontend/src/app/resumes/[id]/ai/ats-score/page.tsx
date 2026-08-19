'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, BarChart2, RefreshCw } from 'lucide-react';

import { useAIJob } from '@/hooks/useAIJob';
import { AIJobStatus } from '@/components/ai/AIJobStatus';
import { ATSScoreCard } from '@/components/ai/ATSScoreCard';
import { Button } from '@/components/ui/button';

/**
 * ATS Score page — triggers ATS analysis job and displays
 * ATSScoreCard when the job completes.
 *
 * Requirements: 6.3
 */
export default function ATSScorePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { status, result, error, dispatch, reset } = useAIJob();

  const handleAnalyze = async () => {
    await dispatch(`/api/resumes/${id}/ai/ats-score`);
  };

  const handleReanalyze = () => {
    reset();
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
        <h1 className="text-xl font-semibold text-foreground">Skor ATS</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        Analisis seberapa baik resume Anda terhadap sistem pelacak pelamar (ATS)
        dan dapatkan rekomendasi perbaikan spesifik.
      </p>

      {(status === 'idle' || status === 'failed') && (
        <Button onClick={handleAnalyze} disabled={isInFlight} className="gap-2">
          <BarChart2 className="h-4 w-4" aria-hidden="true" />
          Analisis ATS
        </Button>
      )}

      {status === 'completed' && (
        <Button variant="outline" onClick={handleReanalyze} className="gap-2">
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Analisis Ulang
        </Button>
      )}

      {(isInFlight || status === 'failed') && (
        <AIJobStatus status={status} error={error} />
      )}

      {status === 'completed' && result && (
        <ATSScoreCard result={result} />
      )}
    </div>
  );
}