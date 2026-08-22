'use client';

import { useState } from 'react';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { ApiResponse } from '@/types/api';

export interface AISummaryConfirmProps {
  resumeId: string;
  /** Draft text from the completed AI job */
  result: string;
  /** Called with the final saved text after a successful confirm */
  onConfirmed: (text: string) => void;
  onCancel: () => void;
}

/**
 * Shows the AI-generated summary draft in an editable textarea.
 * The user can edit before saving. On "Simpan", POSTs to the confirm endpoint.
 *
 * Requirements: 4.5, 4.6
 */
export function AISummaryConfirm({
  resumeId,
  result,
  onConfirmed,
  onCancel,
}: AISummaryConfirmProps) {
  const [text, setText] = useState(result);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!text.trim()) return;

    setIsSaving(true);
    setError(null);

    try {
      await apiClient.post<ApiResponse<unknown>>(
        `/api/resumes/${resumeId}/ai/summary/confirm`,
        { summary_text: text },
      );
      onConfirmed(text);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Gagal menyimpan ringkasan. Silakan coba lagi.';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="animate-fade-in-up space-y-4">
      <div>
        <p className="mb-2 text-sm font-medium text-foreground">
          Ringkasan yang dihasilkan AI
        </p>
        <p className="mb-3 text-xs text-muted-foreground">
          Anda dapat mengedit teks di bawah sebelum menyimpan.
        </p>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          className="resize-y"
          placeholder="Ringkasan profil profesional..."
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
