'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2, FolderOpen, ExternalLink } from 'lucide-react';

import type { Project } from '@/types/resume';
import { projectSchema, type ProjectInput } from '@/lib/validations/resume.schema';
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

export interface ProjectsFormProps {
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

const EMPTY_DEFAULTS: ProjectInput = {
  name: '',
  description: null,
  url: '',
  tech_stack: null,
};

// ─── Modal Form ───────────────────────────────────────────────────────────────

interface ProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Project | null;
  onSave: (data: ProjectInput, id?: string) => Promise<void>;
}

function ProjectModal({ open, onOpenChange, initial, onSave }: ProjectModalProps) {
  const isEdit = !!initial;
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
    defaultValues: EMPTY_DEFAULTS,
  });

  useEffect(() => {
    if (open) {
      reset(
        initial
          ? {
              name: initial.name,
              description: initial.description ?? null,
              url: initial.url ?? '',
              tech_stack: initial.tech_stack ?? null,
            }
          : EMPTY_DEFAULTS,
      );
    }
  }, [open, initial, reset]);

  async function onSubmit(data: ProjectInput) {
    setSubmitting(true);
    try {
      // Convert empty string URL to null before sending
      const payload: ProjectInput = {
        ...data,
        url: data.url === '' ? null : data.url,
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
          <DialogTitle>{isEdit ? 'Edit Proyek' : 'Tambah Proyek'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <Field label="Nama Proyek" error={errors.name?.message} required>
            <Input
              {...register('name')}
              placeholder="cth. AlresumeBuilder"
              aria-invalid={!!errors.name}
            />
          </Field>

          <Field label="Deskripsi" error={errors.description?.message}>
            <Textarea
              {...register('description')}
              placeholder="Jelaskan proyek kamu secara singkat..."
              className="min-h-20 resize-y"
              aria-invalid={!!errors.description}
            />
          </Field>

          <Field label="URL Proyek" error={errors.url?.message}>
            <Input
              {...register('url')}
              type="url"
              placeholder="https://github.com/username/project"
              aria-invalid={!!errors.url}
            />
          </Field>

          <Field label="Tech Stack" error={errors.tech_stack?.message}>
            <Input
              {...register('tech_stack')}
              placeholder="cth. Next.js, TypeScript, PostgreSQL"
              aria-invalid={!!errors.tech_stack}
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

export function ProjectsForm({ resumeId }: ProjectsFormProps) {
  const [entries, setEntries] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Project | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await apiClient.get<{ data: { projects: Project[] } }>(
        `/api/resumes/${resumeId}/projects`,
      );
      setEntries(res.data.data.projects);
    } catch {
      setLoadError('Gagal memuat data proyek.');
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

  function openEdit(entry: Project) {
    setEditTarget(entry);
    setModalOpen(true);
  }

  async function handleSave(data: ProjectInput, id?: string) {
    if (id) {
      const res = await apiClient.patch<{ data: { project: Project } }>(
        `/api/resumes/${resumeId}/projects/${id}`,
        data,
      );
      setEntries((prev) => prev.map((e) => (e.id === id ? res.data.data.project : e)));
    } else {
      const res = await apiClient.post<{ data: { project: Project } }>(
        `/api/resumes/${resumeId}/projects`,
        data,
      );
      setEntries((prev) => [...prev, res.data.data.project]);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await apiClient.delete(`/api/resumes/${resumeId}/projects/${id}`);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">Proyek</h3>
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
          <FolderOpen className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            Belum ada proyek. Klik &ldquo;Tambah&rdquo; untuk mulai.
          </p>
        </div>
      )}

      {entries.length > 0 && (
        <ul className="space-y-3" role="list">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="rounded-lg border bg-card p-4 space-y-1.5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-medium text-sm">{entry.name}</p>
                    {entry.url && (
                      <a
                        href={entry.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 text-xs text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                        Link
                      </a>
                    )}
                  </div>
                  {entry.tech_stack && (
                    <p className="text-xs text-muted-foreground">{entry.tech_stack}</p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(entry)}
                    aria-label={`Edit proyek ${entry.name}`}
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(entry.id)}
                    disabled={deletingId === entry.id}
                    aria-label={`Hapus proyek ${entry.name}`}
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
            </li>
          ))}
        </ul>
      )}

      <ProjectModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initial={editTarget}
        onSave={handleSave}
      />
    </div>
  );
}

export default ProjectsForm;
