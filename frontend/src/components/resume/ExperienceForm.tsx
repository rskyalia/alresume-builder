'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2, Briefcase, Sparkles } from 'lucide-react';

import type { Experience } from '@/types/resume';
import {
  experienceSchema,
  type ExperienceInput,
} from '@/lib/validations/resume.schema';
import apiClient from '@/lib/api-client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ExperienceFormProps {
  resumeId: string;
  /** Called when the user clicks "AI Rewrite" on an entry. */
  onAIRewrite?: (experience: Experience) => void;
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

const EMPTY_DEFAULTS: ExperienceInput = {
  company: '',
  position: '',
  start_date: '',
  end_date: null,
  is_current: false,
  description: null,
};

// ─── Modal Form ───────────────────────────────────────────────────────────────

interface ExperienceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Experience | null;
  onSave: (data: ExperienceInput, id?: string) => Promise<void>;
}

function ExperienceModal({ open, onOpenChange, initial, onSave }: ExperienceModalProps) {
  const isEdit = !!initial;
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ExperienceInput>({
    resolver: zodResolver(experienceSchema),
    defaultValues: EMPTY_DEFAULTS,
  });

  const isCurrent = watch('is_current');

  // Sync form values when dialog opens/changes target
  useEffect(() => {
    if (open) {
      reset(
        initial
          ? {
              company: initial.company,
              position: initial.position,
              start_date: initial.start_date,
              end_date: initial.end_date ?? null,
              is_current: initial.is_current,
              description: initial.description ?? null,
            }
          : EMPTY_DEFAULTS,
      );
    }
  }, [open, initial, reset]);

  // Clear end_date when is_current becomes true
  useEffect(() => {
    if (isCurrent) {
      setValue('end_date', null);
    }
  }, [isCurrent, setValue]);

  async function onSubmit(data: ExperienceInput) {
    setSubmitting(true);
    try {
      await onSave(data, initial?.id);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Pengalaman' : 'Tambah Pengalaman'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <Field label="Nama Perusahaan" error={errors.company?.message} required>
            <Input
              {...register('company')}
              placeholder="cth. PT. Tokopedia"
              aria-invalid={!!errors.company}
            />
          </Field>

          <Field label="Posisi / Jabatan" error={errors.position?.message} required>
            <Input
              {...register('position')}
              placeholder="cth. Software Engineer"
              aria-invalid={!!errors.position}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Tanggal Mulai" error={errors.start_date?.message} required>
              <Input
                {...register('start_date')}
                type="date"
                aria-invalid={!!errors.start_date}
              />
            </Field>

            <Field label="Tanggal Selesai" error={errors.end_date?.message}>
              <Input
                {...register('end_date')}
                type="date"
                disabled={isCurrent}
                aria-invalid={!!errors.end_date}
              />
              {isCurrent && (
                <p className="text-xs text-muted-foreground">Dinonaktifkan — masih berlangsung</p>
              )}
            </Field>
          </div>

          {/* is_current toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register('is_current')}
              className="h-4 w-4 rounded border-input accent-primary"
            />
            <span className="text-sm">Masih bekerja di sini</span>
          </label>

          <Field label="Deskripsi Pekerjaan" error={errors.description?.message}>
            <Textarea
              {...register('description')}
              placeholder="Jelaskan tanggung jawab dan pencapaian kamu..."
              className="min-h-25 resize-y"
              aria-invalid={!!errors.description}
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

export function ExperienceForm({ resumeId, onAIRewrite }: ExperienceFormProps) {
  const [entries, setEntries] = useState<Experience[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Experience | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await apiClient.get<{ data: { experience: Experience[] } }>(
        `/api/resumes/${resumeId}/experience`,
      );
      setEntries(res.data.data.experience);
    } catch {
      setLoadError('Gagal memuat data pengalaman.');
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

  function openEdit(entry: Experience) {
    setEditTarget(entry);
    setModalOpen(true);
  }

  async function handleSave(data: ExperienceInput, id?: string) {
    if (id) {
      const res = await apiClient.patch<{ data: { experience: Experience } }>(
        `/api/resumes/${resumeId}/experience/${id}`,
        data,
      );
      setEntries((prev) => prev.map((e) => (e.id === id ? res.data.data.experience : e)));
    } else {
      const res = await apiClient.post<{ data: { experience: Experience } }>(
        `/api/resumes/${resumeId}/experience`,
        data,
      );
      setEntries((prev) => [...prev, res.data.data.experience]);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await apiClient.delete(`/api/resumes/${resumeId}/experience/${id}`);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">Pengalaman Kerja</h3>
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
          <Briefcase className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            Belum ada data pengalaman. Klik &ldquo;Tambah&rdquo; untuk mulai.
          </p>
        </div>
      )}

      {entries.length > 0 && (
        <ul className="space-y-3" role="list">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="rounded-lg border bg-card p-4 space-y-2"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{entry.position}</p>
                  <p className="text-sm text-muted-foreground">{entry.company}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {entry.start_date} – {entry.is_current ? 'Sekarang' : (entry.end_date ?? '—')}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(entry)}
                    aria-label={`Edit pengalaman di ${entry.company}`}
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(entry.id)}
                    disabled={deletingId === entry.id}
                    aria-label={`Hapus pengalaman di ${entry.company}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>

              {entry.description && (
                <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-line">
                  {entry.description}
                </p>
              )}

              {onAIRewrite && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAIRewrite(entry)}
                  className="text-xs"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                  AI Rewrite
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      <ExperienceModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initial={editTarget}
        onSave={handleSave}
      />
    </div>
  );
}

export default ExperienceForm;
