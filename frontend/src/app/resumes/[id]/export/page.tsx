'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';

import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

// --- Types

interface PdfTemplate {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_pro: boolean;
}

const FALLBACK_TEMPLATES: PdfTemplate[] = [
  {
    id: 'default',
    name: 'Default',
    slug: 'default',
    description: 'Template ATS-friendly satu kolom',
    is_pro: false,
  },
];

/**
 * Export PDF page — lets users select a PDF template and download
 * their resume as a PDF file.
 *
 * Requirements: 8.1, 8.2, 8.3, 10.3
 */
export default function ExportPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [templates, setTemplates] = useState<PdfTemplate[]>(FALLBACK_TEMPLATES);
  const [selectedSlug, setSelectedSlug] = useState<string>('default');
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setIsLoadingTemplates(true);
    try {
      const res = await apiClient.get<ApiResponse<PdfTemplate[]>>('/api/pdf-templates');
      const data = res.data.data;
      if (Array.isArray(data) && data.length > 0) {
        setTemplates(data);
        const hasDefault = data.some((t) => t.slug === 'default');
        if (!hasDefault) {
          setSelectedSlug(data[0].slug);
        }
      }
    } catch {
      // Use fallback templates already set as initial state
    } finally {
      setIsLoadingTemplates(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadError(null);

    try {
      const response = await apiClient.get(
        `/api/resumes/${id}/export/pdf`,
        {
          params: { template: selectedSlug },
          responseType: 'blob',
        },
      );

      const blob = new Blob([response.data as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `resume-${id}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 403) {
        setDownloadError(
          'Template ini hanya tersedia untuk akun Pro. Silakan upgrade atau pilih template lain.',
        );
      } else {
        setDownloadError('Gagal mengunduh PDF. Silakan coba lagi.');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/resumes/${id}`} aria-label="Kembali ke Resume Builder">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
        <h1 className="text-xl font-semibold text-foreground">Export PDF</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        Pilih template dan unduh resume Anda sebagai file PDF.
      </p>

      {/* Template selector */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">Pilih Template</p>

        {isLoadingTemplates ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span>Memuat template...</span>
          </div>
        ) : (
          <div
            className="grid gap-3 sm:grid-cols-2"
            role="radiogroup"
            aria-label="Pilih template PDF"
          >
            {templates.map((template) => {
              const isSelected = selectedSlug === template.slug;
              return (
                <button
                  key={template.slug}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setSelectedSlug(template.slug)}
                  className={[
                    'rounded-lg border p-4 text-left transition-colors',
                    'hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      {template.name}
                    </span>
                    {template.is_pro && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        Pro
                      </span>
                    )}
                  </div>
                  {template.description && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {template.description}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {downloadError && (
        <Alert variant="destructive">
          <AlertDescription>{downloadError}</AlertDescription>
        </Alert>
      )}

      <Button
        onClick={handleDownload}
        disabled={isDownloading || isLoadingTemplates}
        className="gap-2"
      >
        {isDownloading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Mengunduh...
          </>
        ) : (
          <>
            <Download className="h-4 w-4" aria-hidden="true" />
            Download PDF
          </>
        )}
      </Button>
    </div>
  );
}