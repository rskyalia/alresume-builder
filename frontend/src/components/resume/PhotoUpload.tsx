'use client';

import React, { useRef, useState } from 'react';
import { User, Loader2, Trash2 } from 'lucide-react';

import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';

export interface PhotoUploadProps {
  resumeId: string;
  currentPhotoUrl: string | null;
  onUploaded: (photoUrl: string) => void;
  onDeleted: () => void;
}

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

export function PhotoUpload({
  resumeId,
  currentPhotoUrl,
  onUploaded,
  onDeleted,
}: PhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function triggerFileSelect() {
    setError(null);
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Reset the input so the same file can be selected again if needed
    e.target.value = '';

    if (!file) return;

    if (file.size > MAX_SIZE_BYTES) {
      setError('Ukuran file melebihi batas 2MB.');
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('photo', file);

      const res = await apiClient.post<{ success: boolean; data: { photo_url: string } }>(
        `/api/resumes/${resumeId}/photo`,
        formData,
      );

      onUploaded(res.data.data.photo_url);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Gagal mengunggah foto. Coba lagi.';
      setError(message);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDelete() {
    setError(null);
    setIsDeleting(true);

    try {
      await apiClient.delete(`/api/resumes/${resumeId}/photo`);
      onDeleted();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Gagal menghapus foto. Coba lagi.';
      setError(message);
    } finally {
      setIsDeleting(false);
    }
  }

  const isBusy = isUploading || isDeleting;

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-foreground">Foto Profil</span>

      <div className="flex items-center gap-4">
        {/* Avatar preview */}
        <div
          className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-muted"
          aria-label="Foto profil"
        >
          {currentPhotoUrl ? (
            <img
              src={currentPhotoUrl}
              alt="Foto profil"
              className="h-full w-full object-cover"
            />
          ) : (
            <User className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
          )}

          {isBusy && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
              <Loader2 className="h-5 w-5 animate-spin text-white" aria-hidden="true" />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={triggerFileSelect}
              disabled={isBusy}
            >
              {isUploading ? 'Mengunggah...' : 'Ganti Foto'}
            </Button>

            {currentPhotoUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={handleDelete}
                disabled={isBusy}
                aria-label="Hapus foto profil"
              >
                <Trash2 className="h-4 w-4 mr-1" aria-hidden="true" />
                {isDeleting ? 'Menghapus...' : 'Hapus Foto'}
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Maks. 2MB. Format: JPG, PNG, WebP
          </p>
        </div>
      </div>

      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpg,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
        aria-hidden="true"
      />
    </div>
  );
}

export default PhotoUpload;
