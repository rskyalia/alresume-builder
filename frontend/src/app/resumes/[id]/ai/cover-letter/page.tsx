'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { CoverLetterEditor } from '@/components/ai/CoverLetterEditor';
import { Button } from '@/components/ui/button';

/**
 * Cover Letter page — renders CoverLetterEditor which handles
 * all form input, job dispatch, polling, and result display.
 *
 * Requirements: 7.4
 */
export default function CoverLetterPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/resumes/${id}`} aria-label="Kembali ke Resume Builder">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
        <h1 className="text-xl font-semibold text-foreground">Cover Letter</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        Buat surat lamaran kerja yang dipersonalisasi berdasarkan data resume Anda
        dan informasi perusahaan yang ingin Anda lamar.
      </p>

      <CoverLetterEditor resumeId={id} />
    </div>
  );
}