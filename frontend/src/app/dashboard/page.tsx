'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, AlertCircle, FileText } from 'lucide-react';

import { useResumes } from '@/hooks/useResumes';
import { ResumeCard } from '@/components/resume/ResumeCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { CreditBadge } from '@/components/layout/CreditBadge';

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-background p-4 space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-8 flex-1" />
            <Skeleton className="h-8 flex-1" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onCreateClick, disabled }: { onCreateClick: () => void; disabled: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-background py-16 text-center">
      <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" aria-hidden="true" />
      <h3 className="text-lg font-semibold mb-1">Belum ada resume</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
        Buat resume pertamamu dan mulai perjalanan karier profesionalmu.
      </p>
      <Button onClick={onCreateClick} disabled={disabled}>
        <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
        Buat Resume Pertama
      </Button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const { resumes, user, isLoading, deleteResume, createResume } = useResumes();
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const noCredits = user.plan === 'free' && user.resume_credits === 0;

  async function handleCreateResume() {
    if (noCredits) return;

    setIsCreating(true);
    setCreateError(null);
    try {
      const resume = await createResume();
      router.push(`/resumes/${resume.id}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Gagal membuat resume. Silakan coba lagi.';
      setCreateError(message);
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Kelola semua resume kamu di sini.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!isLoading && (
            <CreditBadge plan={user.plan} credits={user.resume_credits} />
          )}
          <Button
            onClick={handleCreateResume}
            disabled={noCredits || isCreating || isLoading}
          >
            {isCreating ? (
              <>
                <span
                  className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent"
                  aria-hidden="true"
                />
                Membuat...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                Buat Resume Baru
              </>
            )}
          </Button>
        </div>
      </div>

      {/* No-credit alert — shown for free users with 0 credits */}
      {!isLoading && noCredits && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Kredit resume habis</AlertTitle>
          <AlertDescription>
            Kamu telah menggunakan semua kredit gratis.{' '}
            <a href="/pricing" className="font-medium underline underline-offset-2">
              Upgrade ke Pro
            </a>{' '}
            untuk membuat resume tanpa batas.
          </AlertDescription>
        </Alert>
      )}

      {/* Create error */}
      {createError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Terjadi kesalahan</AlertTitle>
          <AlertDescription>{createError}</AlertDescription>
        </Alert>
      )}

      {/* Content */}
      {isLoading ? (
        <DashboardSkeleton />
      ) : resumes.length === 0 ? (
        <EmptyState onCreateClick={handleCreateResume} disabled={noCredits} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resumes.map((resume) => (
            <ResumeCard
              key={resume.id}
              resume={resume}
              onDelete={deleteResume}
            />
          ))}
        </div>
      )}

      {/* Resume count footer */}
      {!isLoading && resumes.length > 0 && (
        <p className="text-xs text-muted-foreground text-right">
          {resumes.length} resume
        </p>
      )}
    </div>
  );
}
