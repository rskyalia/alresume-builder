'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, AlertCircle, FileText, LayoutDashboard } from 'lucide-react';

import { useResumes } from '@/hooks/useResumes';
import { useAuth } from '@/hooks/useAuth';
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
        <div key={i} className="space-y-3 rounded-xl border bg-background p-4">
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
    <div className="animate-fade-in-up relative flex flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed bg-background py-16 text-center">
      {/* Decorative gradient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-20 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-gradient-to-tr from-violet-500/10 via-fuchsia-500/10 to-sky-500/10 blur-3xl"
      />
      <span className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/15 via-fuchsia-500/15 to-sky-500/15">
        <FileText className="h-8 w-8 text-muted-foreground/70" aria-hidden="true" />
      </span>
      <h3 className="relative mb-1 text-lg font-semibold">Belum ada resume</h3>
      <p className="relative mb-6 max-w-xs text-sm leading-relaxed text-muted-foreground">
        Buat resume pertamamu dan mulai perjalanan karier profesionalmu.
      </p>
      <Button
        onClick={onCreateClick}
        disabled={disabled}
        className="relative gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-fuchsia-500/20 transition-all hover:opacity-90 hover:shadow-lg hover:shadow-fuchsia-500/30"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Buat Resume Pertama
      </Button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const { resumes, user, isLoading, deleteResume, createResume } = useResumes();
  const { user: authUser } = useAuth();
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

  const displayName = authUser?.name?.trim();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header with decorative gradient */}
      <div className="relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm sm:p-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-gradient-to-tr from-violet-500/15 via-fuchsia-500/10 to-sky-500/15 blur-3xl"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="mb-0.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <LayoutDashboard className="h-3.5 w-3.5" aria-hidden="true" />
              Dashboard
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              Selamat datang kembali{displayName ? `, ${displayName}` : ''}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
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
              className="gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-fuchsia-500/20 transition-all hover:opacity-90 hover:shadow-lg hover:shadow-fuchsia-500/30"
            >
              {isCreating ? (
                <>
                  <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                    aria-hidden="true"
                  />
                  Membuat...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Buat Resume Baru
                </>
              )}
            </Button>
          </div>
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
          {resumes.map((resume, index) => (
            <div
              key={resume.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
            >
              <ResumeCard resume={resume} onDelete={deleteResume} />
            </div>
          ))}
        </div>
      )}

      {/* Resume count footer */}
      {!isLoading && resumes.length > 0 && (
        <p className="text-right text-xs text-muted-foreground">
          {resumes.length} resume tersimpan
        </p>
      )}
    </div>
  );
}
