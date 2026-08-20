'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Sparkles, BarChart2, Mail, FileDown } from 'lucide-react';

import type { Resume } from '@/types/resume';
import apiClient from '@/lib/api-client';

import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ResumeFormTabs } from '@/components/resume/ResumeFormTabs';
import { ShareToggle } from '@/components/resume/ShareToggle';

// --- AI Feature links

const AI_LINKS = [
  {
    href: (id: string) => `/resumes/${id}/ai/summary`,
    label: 'AI Summary',
    icon: Sparkles,
  },
  {
    href: (id: string) => `/resumes/${id}/ai/ats-score`,
    label: 'Skor ATS',
    icon: BarChart2,
  },
  {
    href: (id: string) => `/resumes/${id}/ai/cover-letter`,
    label: 'Cover Letter',
    icon: Mail,
  },
  {
    href: (id: string) => `/resumes/${id}/export`,
    label: 'Export PDF',
    icon: FileDown,
  },
] as const;

// --- Component

export default function ResumeBuilderPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [resume, setResume] = useState<Resume | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchResume = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await apiClient.get<{ data: { resume: Resume } }>(`/api/resumes/${id}`);
      setResume(res.data.data.resume);
    } catch {
      setLoadError('Gagal memuat resume. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchResume();
  }, [fetchResume]);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (loadError || !resume) {
    return (
      <div className="max-w-md space-y-4">
        <Alert variant="destructive">
          <AlertTitle>Gagal memuat resume</AlertTitle>
          <AlertDescription>
            {loadError ?? 'Resume tidak ditemukan.'}
          </AlertDescription>
        </Alert>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-1.5" aria-hidden="true" />
              Kembali ke Dashboard
            </Link>
          </Button>
          <Button onClick={fetchResume}>Coba Lagi</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard" aria-label="Kembali ke Dashboard">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
        <h1 className="text-xl font-semibold text-foreground truncate">
          {resume.title}
        </h1>
      </div>

      <ResumeFormTabs
        resumeId={id}
        resume={resume}
        onResumeUpdated={setResume}
      />

      <nav aria-label="Fitur AI dan Export">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Fitur AI &amp; Export
        </p>
        <div className="flex flex-wrap gap-2">
          {AI_LINKS.map(({ href, label, icon: Icon }) => (
            <Button key={label} variant="outline" size="sm" asChild>
              <Link href={href(id)} className="gap-2">
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </Link>
            </Button>
          ))}
        </div>
      </nav>

      <ShareToggle
        resumeId={id}
        initialIsPublic={resume.is_public}
        initialSlug={resume.public_slug ?? null}
        onUpdated={(isPublic, slug) =>
          setResume((r) => (r ? { ...r, is_public: isPublic, public_slug: slug } : r))
        }
      />
    </div>
  );
}
