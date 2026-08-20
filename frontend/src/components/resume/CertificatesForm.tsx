'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2, Award, ExternalLink } from 'lucide-react';

import type { Certificate } from '@/types/resume';
import { certificateSchema, type CertificateInput } from '@/lib/validations/resume.schema';
import apiClient from '@/lib/api-client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { CertificateFileUpload } from '@/components/resume/CertificateFileUpload';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface CertificatesFormProps {
  resumeId: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

const EMPTY_DEFAULTS: CertificateInput = {
  name: '',
  issuer: '',
  issue_date: '',
  credential_url: '',
};

// ─── Modal Form ───────────────────────────────────────────────────────────────

interface CertificateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Certificate | null;
  onSave: (data: CertificateInput, id?: string) => Promise<void>;
}

function CertificateModal({ open, onOpenChange, initial, onSave }: CertificateModalProps) {
  const isEdit = !!initial;
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CertificateInput>({
    resolver: zodResolver(certificateSchema),
    defaultValues: EMPTY_DEFAULTS,
  });

  useEffect(() => {
    if (open) {
      reset(
        initial
          ? {
              name: initial.name,
              issuer: initial.issuer,
              issue_date: initial.issue_date,
              credential_url: initial.credential_url ?? '',
            }
          : EMPTY_DEFAULTS,
      );
    }
  }, [open, initial, reset]);

  async function onSubmit(data: CertificateInput) {
    setSubmitting(true);
    try {
      // Convert empty string URL to null before sending
      const payload: CertificateInput = {
        ...data,
        credential_url: data.credential_url === '' ? null : data.credential_url,
      };
      await onSave(payload, initial?.id);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Sertifikat' : 'Tambah Sertifikat'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <Field label="Nama Sertifikat" error={errors.name?.message} required>
            <Input
              {...register('name')}
              placeholder="cth. AWS Certified Solutions Architect"
              aria-invalid={!!errors.name}
            />
          </Field>

          <Field label="Penerbit (Issuer)" error={errors.issuer?.message} required>
            <Input
              {...register('issuer')}
              placeholder="cth. Amazon Web Services"
              aria-invalid={!!errors.issuer}
            />
          </Field>

          <Field label="Tanggal Penerbitan" error={errors.issue_date?.message} required>
            <Input
              {...register('issue_date')}
              type="date"
              aria-invalid={!!errors.issue_date}
            />
          </Field>

          <Field label="URL Kredensial" error={errors.credential_url?.message}>
            <Input
              {...register('credential_url')}
              type="url"
              placeholder="https://www.credential.net/..."
              aria-invalid={!!errors.credential_url}
            />
          </Field>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={submitting}>
                Batal
              </Button>
            </DialogClose>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CertificatesForm({ resumeId }: CertificatesFormProps) {
  const [entries, setEntries] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Certificate | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await apiClient.get<{ data: { certificates: Certificate[] } }>(
        `/api/resumes/${resumeId}/certificates`,
      );
      setEntries(res.data.data.certificates);
    } catch {
      setLoadError('Gagal memuat data sertifikat.');
    } finally {
      setIsLoading(false);
    }
  }, [resumeId]);

  useEffect(() => {
    load();
  }, [load]);

  function openAdd() {
    setEditTarget(null);
    setModalOpen(true);
  }

  function openEdit(entry: Certificate) {
    setEditTarget(entry);
    setModalOpen(true);
  }

  async function handleSave(data: CertificateInput, id?: string) {
    if (id) {
      const res = await apiClient.patch<{ data: { certificate: Certificate } }>(
        `/api/resumes/${resumeId}/certificates/${id}`,
        data,
      );
      setEntries((prev) => prev.map((e) => (e.id === id ? res.data.data.certificate : e)));
    } else {
      const res = await apiClient.post<{ data: { certificate: Certificate } }>(
        `/api/resumes/${resumeId}/certificates`,
        data,
      );
      setEntries((prev) => [...prev, res.data.data.certificate]);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await apiClient.delete(`/api/resumes/${resumeId}/certificates/${id}`);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">Sertifikat</h3>
        <Button size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
          Tambah
        </Button>
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground">Memuat...</p>
      )}

      {loadError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{loadError}</p>
          <Button variant="ghost" size="sm" className="mt-1" onClick={load}>
            Coba lagi
          </Button>
        </div>
      )}

      {!isLoading && !loadError && entries.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-8 text-center">
          <Award className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            Belum ada sertifikat. Klik &ldquo;Tambah&rdquo; untuk mulai.
          </p>
        </div>
      )}

      {entries.length > 0 && (
        <ul className="space-y-3" role="list">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex items-start justify-between gap-4 rounded-lg border bg-card p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="font-medium text-sm">{entry.name}</p>
                  {entry.credential_url && (
                    <a
                      href={entry.credential_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 text-xs text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      Verifikasi
                    </a>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{entry.issuer}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{entry.issue_date}</p>

                <CertificateFileUpload
                  resumeId={resumeId}
                  certificateId={entry.id}
                  currentFileUrl={entry.file_url ?? null}
                  onUploaded={(url) =>
                    setEntries((prev) =>
                      prev.map((e) => (e.id === entry.id ? { ...e, file_url: url } : e)),
                    )
                  }
                  onDeleted={() =>
                    setEntries((prev) =>
                      prev.map((e) => (e.id === entry.id ? { ...e, file_url: null } : e)),
                    )
                  }
                />
              </div>

              <div className="flex gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEdit(entry)}
                  aria-label={`Edit sertifikat ${entry.name}`}
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(entry.id)}
                  disabled={deletingId === entry.id}
                  aria-label={`Hapus sertifikat ${entry.name}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <CertificateModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initial={editTarget}
        onSave={handleSave}
      />
    </div>
  );
}

export default CertificatesForm;
