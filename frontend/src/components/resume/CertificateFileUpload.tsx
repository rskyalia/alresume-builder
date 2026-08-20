'use client';

import React, { useRef, useState } from 'react';
import { Upload, Loader2, Trash2, FileText } from 'lucide-react';

import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';

export interface CertificateFileUploadProps {
  resumeId: string;
  certificateId: string;
  currentFileUrl: string | null;
  onUploaded: (fileUrl: string) => void;
  onDeleted: () => void;
}

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export function CertificateFileUpload({
  resumeId,
  certificateId,
  currentFileUrl,
  onUploaded,
  onDeleted,
}: CertificateFileUploadProps) {
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
    // Reset input so same file can be reselected
    e.target.value = '';

    if (!file) return;

    if (file.size > MAX_SIZE_BYTES) {
      setError('Ukuran file melebihi batas 5MB.');
      return;
    }

    if (file.type !== 'application/pdf') {
      setError('Hanya file PDF yang diperbolehkan.');
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await apiClient.post<{ success: boolean; data: { file_url: string } }>(
        `/api/resumes/${resumeId}/certificates/${certificateId}/file`,
        formData,
      );

      onUploaded(res.data.data.file_url);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Gagal mengunggah file. Coba lagi.';
      setError(message);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDelete() {
    setError(null);
    setIsDeleting(true);

    try {
      await apiClient.delete(
        `/api/resumes/${resumeId}/certificates/${certificateId}/file`,
      );
      onDeleted();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Gagal menghapus file. Coba lagi.';
      setError(message);
    } finally {
      setIsDeleting(false);
    }
  }

  const isBusy = isUploading || isDeleting;

  return (
    <div className="mt-2 flex flex-col gap-1.5">
      {currentFileUrl ? (
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={currentFileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-2.5 py-1 text-xs font-medium text-foreground hover:bg-accent transition-colors"
          >
            <FileText className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            Lihat PDF
          </a>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-destructive hover:text-destructive"
            onClick={handleDelete}
            disabled={isBusy}
            aria-label="Hapus file PDF sertifikat"
          >
            {isDeleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span className="ml-1">{isDeleting ? 'Menghapus...' : 'Hapus'}</span>
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 px-2.5 text-xs w-fit"
          onClick={triggerFileSelect}
          disabled={isBusy}
        >
          {isUploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" aria-hidden="true" />
          ) : (
            <Upload className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
          )}
          {isUploading ? 'Mengunggah...' : 'Upload PDF Sertifikat'}
        </Button>
      )}

      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileChange}
        aria-hidden="true"
      />
    </div>
  );
}

export default CertificateFileUpload;
