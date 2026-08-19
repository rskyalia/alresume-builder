'use client';

import React, { useState } from 'react';
import { Globe, Lock, Copy, Check, Loader2 } from 'lucide-react';

import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// ─── Types ────────────────────────────────────────────────────────────────────

interface VisibilityResponse {
  data: {
    is_public: boolean;
    public_slug: string | null;
    public_url: string | null;
  };
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ShareToggleProps {
  resumeId: string;
  initialIsPublic: boolean;
  initialSlug: string | null;
  onUpdated?: (isPublic: boolean, slug: string | null) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ShareToggle({
  resumeId,
  initialIsPublic,
  initialSlug,
  onUpdated,
}: ShareToggleProps) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [slug, setSlug] = useState<string | null>(initialSlug);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Build the full public URL from current origin + slug
  const publicUrl =
    isPublic && slug
      ? `${typeof window !== 'undefined' ? window.location.origin : ''}/r/${slug}`
      : null;

  async function handleToggle() {
    setIsLoading(true);
    setError(null);

    try {
      const res = await apiClient.patch<VisibilityResponse>(
        `/api/resumes/${resumeId}/visibility`,
        { is_public: !isPublic },
      );

      const { is_public, public_slug } = res.data.data;
      setIsPublic(is_public);
      setSlug(public_slug);
      onUpdated?.(is_public, public_slug);
    } catch {
      setError('Gagal mengubah visibilitas. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopy() {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text manually if clipboard API unavailable
    }
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {isPublic ? (
            <Globe className="h-4 w-4 text-green-600" aria-hidden="true" />
          ) : (
            <Lock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          )}
          <span className="text-sm font-medium">
            {isPublic ? 'Resume publik' : 'Resume privat'}
          </span>
        </div>

        <Button
          variant={isPublic ? 'outline' : 'default'}
          size="sm"
          onClick={handleToggle}
          disabled={isLoading}
          aria-label={isPublic ? 'Nonaktifkan akses publik' : 'Aktifkan akses publik'}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" aria-hidden="true" />
              Memproses...
            </>
          ) : isPublic ? (
            'Nonaktifkan'
          ) : (
            'Aktifkan'
          )}
        </Button>
      </div>

      {/* Public URL row — only shown when resume is public */}
      {isPublic && publicUrl && (
        <div className="flex gap-2" role="group" aria-label="URL publik resume">
          <Input
            value={publicUrl}
            readOnly
            className="text-xs font-mono"
            aria-label="URL publik resume"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            aria-label={copied ? 'Tersalin' : 'Salin URL'}
            className="shrink-0"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 mr-1.5 text-green-600" aria-hidden="true" />
                Tersalin!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                Salin
              </>
            )}
          </Button>
        </div>
      )}

      {/* Inline error */}
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default ShareToggle;
