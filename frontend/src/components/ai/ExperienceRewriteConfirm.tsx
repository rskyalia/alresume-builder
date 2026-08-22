'use client';

import { useState } from 'react';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { ApiResponse } from '@/types/api';

export interface ExperienceRewriteConfirmProps {
  resumeId: string;
  experienceId: string;
  /** Draft text from the completed AI job */
  result: string;
  /** Called with the final saved text after a successful confirm */
  onConfirmed: (text: string) => void;
  onCancel: () => void;
}

const FALLBACK_ERROR = 'Gagal menyimpan deskripsi pengalaman. Silakan coba lagi.';

function extractApiErrorMessage(err: unknown): string {
  const response =
    typeof err === 'object' && err !== null && 'response' in err
      ? (err as { response?: unknown }).response
      : undefined;
  const message =
    typeof response === 'object' && response !== null && 'data' in response
      ? (response as { data?: { message?: unknown } }).data?.message
      : undefined;
  return typeof message === 'string' && message.length > 0 ? message : FALLBACK_ERROR;
}

/**
 * Shows the AI-rewritten experience description in an editable textarea.
 * On "Simpan", POSTs to the confirm endpoint.
 *
 * Requirements: 5.5, 5.6
 */
export function ExperienceRewriteConfirm({
  resumeId,
  experienceId,
  result,
  onConfirmed,
  onCancel,
}: ExperienceRewriteConfirmProps) {
  const [text, setText] = useState(result);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!text.trim()) return;

    setIsSaving(true);
    setError(null);

    try {
      await apiClient.post<ApiResponse<unknown>>(
        `/api/resumes/${resumeId}/experiences/${experienceId}/ai/rewrite/confirm`,
        { description_text: text },
      );
      onConfirmed(text);
    } catch (err: unknown) {
      setError(extractApiErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-medium text-foreground">
          Deskripsi yang ditulis ulang oleh AI
        </p>
        <p className="mb-3 text-xs text-muted-foreground">
          Anda dapat mengedit teks di bawah sebelum menyimpan.
        </p>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          className="resize-y"
          placeholder="Deskripsi pengalaman kerja..."
          disabled={isSaving}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={isSaving || !text.trim()}>
          {isSaving ? 'Menyimpan...' : 'Simpan'}
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>
          Batal
        </Button>
      </div>
    </div>
  );
}
