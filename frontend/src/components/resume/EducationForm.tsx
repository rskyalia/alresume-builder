'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2, GraduationCap } from 'lucide-react';

import type { Education } from '@/types/resume';
import {
  educationSchema,
  type EducationInput,
} from '@/lib/validations/resume.schema';
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

// ─── Props ────────────────────────────────────────────────────────────────────

export interface EducationFormProps {
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

const EMPTY_DEFAULTS: EducationInput = {
  institution: '',
  degree: '',
  field_of_study: '',
  start_date: '',
  end_date: null,
  gpa: null,
};

// ─── Modal Form ───────────────────────────────────────────────────────────────

interface EducationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Education | null;
  onSave: (data: EducationInput, id?: string) => Promise<void>;
}

function EducationModal({ open, onOpenChange, initial, onSave }: EducationModalProps) {
  const isEdit = !!initial;
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EducationInput>({
    resolver: zodResolver(educationSchema),
    defaultValues: EMPTY_DEFAULTS,
  });

  // Sync form values when dialog opens/changes target
  useEffect(() => {
    if (open) {
      reset(
        initial
          ? {
              institution: initial.institution,
              degree: initial.degree,
              field_of_study: initial.field_of_study,
              start_date: initial.start_date,
              end_date: initial.end_date ?? null,
              gpa: initial.gpa ?? null,
            }
          : EMPTY_DEFAULTS,
      );
    }
  }, [open, initial, reset]);

  async function onSubmit(data: EducationInput) {
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
          <DialogTitle>{isEdit ? 'Edit Pendidikan' : 'Tambah Pendidikan'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <Field label="Nama Institusi" error={errors.institution?.message} required>
            <Input
              {...register('institution')}
              placeholder="cth. Universitas Indonesia"
              aria-invalid={!!errors.institution}
            />
          </Field>

          <Field label="Gelar" error={errors.degree?.message} required>
            <Input
              {...register('degree')}
              placeholder="cth. Sarjana Teknik"
              aria-invalid={!!errors.degree}
            />
          </Field>

          <Field label="Bidang Studi" error={errors.field_of_study?.message} required>
            <Input
              {...register('field_of_study')}
              placeholder="cth. Teknik Informatika"
              aria-invalid={!!errors.field_of_study}
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
                aria-invalid={!!errors.end_date}
              />
              <p className="text-xs text-muted-foreground">Kosongkan jika masih berlangsung</p>
            </Field>
          </div>

          <Field label="IPK / GPA" error={errors.gpa?.message}>
            <Input
              {...register('gpa')}
              placeholder="cth. 3.75"
              aria-invalid={!!errors.gpa}
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

export function EducationForm({ resumeId }: EducationFormProps) {
  const [entries, setEntries] = useState<Education[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Education | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await apiClient.get<{ data: Education[] }>(
        `/api/resumes/${resumeId}/education`,
      );
      setEntries(res.data.data);
    } catch {
      setLoadError('Gagal memuat data pendidikan.');
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

  function openEdit(entry: Education) {
    setEditTarget(entry);
    setModalOpen(true);
  }

  async function handleSave(data: EducationInput, id?: string) {
    if (id) {
      const res = await apiClient.patch<{ data: Education }>(
        `/api/resumes/${resumeId}/education/${id}`,
        data,
      );
      setEntries((prev) => prev.map((e) => (e.id === id ? res.data.data : e)));
    } else {
      const res = await apiClient.post<{ data: Education }>(
        `/api/resumes/${resumeId}/education`,
        data,
      );
      setEntries((prev) => [...prev, res.data.data]);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await apiClient.delete(`/api/resumes/${resumeId}/education/${id}`);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">Pendidikan</h3>
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
          <GraduationCap className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            Belum ada data pendidikan. Klik &ldquo;Tambah&rdquo; untuk mulai.
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
                <p className="font-medium text-sm truncate">{entry.institution}</p>
                <p className="text-sm text-muted-foreground">
                  {entry.degree} — {entry.field_of_study}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {entry.start_date} – {entry.end_date ?? 'Sekarang'}
                  {entry.gpa && ` · IPK ${entry.gpa}`}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEdit(entry)}
                  aria-label={`Edit pendidikan di ${entry.institution}`}
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(entry.id)}
                  disabled={deletingId === entry.id}
                  aria-label={`Hapus pendidikan di ${entry.institution}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <EducationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initial={editTarget}
        onSave={handleSave}
      />
    </div>
  );
}

export default EducationForm;
