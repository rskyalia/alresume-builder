'use client';

import { useMemo } from 'react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

export interface ATSScoreCardProps {
  /** JSON string: { score: number, recommendations: string[] } */
  result: string;
}

interface ATSResult {
  score: number;
  recommendations: string[];
}

function parseATSResult(raw: string): ATSResult | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'score' in parsed &&
      'recommendations' in parsed &&
      typeof (parsed as ATSResult).score === 'number' &&
      Array.isArray((parsed as ATSResult).recommendations)
    ) {
      return parsed as ATSResult;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Displays the ATS analysis result:
 * - Large score number with color indicator
 * - Progress bar representing the score
 * - Bullet list of recommendations
 *
 * Requirements: 6.3
 */
export function ATSScoreCard({ result }: ATSScoreCardProps) {
  const parsed = useMemo(() => parseATSResult(result), [result]);

  if (!parsed) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Gagal memproses hasil analisis ATS. Format data tidak valid.
        </AlertDescription>
      </Alert>
    );
  }

  const { score, recommendations } = parsed;
  const clampedScore = Math.min(100, Math.max(0, Math.round(score)));

  // Determine color based on score
  const scoreColor =
    clampedScore >= 80
      ? 'text-green-600 dark:text-green-400'
      : clampedScore >= 50
        ? 'text-yellow-600 dark:text-yellow-400'
        : 'text-red-600 dark:text-red-400';

  const barColor =
    clampedScore >= 80
      ? '[&>div]:bg-green-500'
      : clampedScore >= 50
        ? '[&>div]:bg-yellow-500'
        : '[&>div]:bg-red-500';

  const label =
    clampedScore >= 80
      ? 'Sangat Baik'
      : clampedScore >= 50
        ? 'Perlu Peningkatan'
        : 'Perlu Perhatian';

  return (
    <div className="space-y-6">
      {/* Score section */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <p className="mb-1 text-sm font-medium text-muted-foreground">Skor ATS</p>
        <div className="flex items-end gap-3">
          <span className={`text-6xl font-bold leading-none ${scoreColor}`}>
            {clampedScore}
          </span>
          <span className="mb-1 text-lg text-muted-foreground">/100</span>
        </div>
        <p className={`mt-1 text-sm font-medium ${scoreColor}`}>{label}</p>

        <div className="mt-4">
          <Progress
            value={clampedScore}
            className={`h-3 ${barColor}`}
            aria-label={`Skor ATS: ${clampedScore} dari 100`}
          />
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-foreground">
            Rekomendasi Perbaikan
          </h3>
          <ul className="space-y-2">
            {recommendations.map((rec, index) => (
              <li key={index} className="flex gap-2 text-sm text-muted-foreground">
                <span className="mt-0.5 flex-shrink-0 text-primary">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
