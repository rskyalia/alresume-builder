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
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { useAIJob } from '@/hooks/useAIJob';
import { AIJobStatus } from '@/components/ai/AIJobStatus';
import { ExperienceRewriteConfirm } from '@/components/ai/ExperienceRewriteConfirm';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ExperienceFormProps {
  resumeId: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractApiErrorMessage(err: unknown, fallback: string): string {
  const response = (
    typeof err === 'object' && err !== null && 'response' in err
      ? (err as { response?: unknown }).response
      : undefined
  );
  const message = (
    typeof response === 'object' && response !== null && 'data' in response
      ? (response as { data?: { message?: unknown } }).data?.message
      : undefined
  );
  return typeof message === 'string' && message.length > 0 ? message : fallback;
}

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

const COMPETITION_LEVELS = [
  'Sekolah',
  'Kabupaten/Kota',
  'Provinsi',
  'Nasional',
  'Internasional',
] as const;

const EMPTY_DEFAULTS: ExperienceInput = {
  experience_type: 'kerja',
  competition_level: null,
  competition_rank: null,
  organization_scope: null,
  company: null,
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

  const expType = watch('experience_type');
  const isCurrent = watch('is_current');

  const isKerja = expType === 'kerja' || !expType;
  const isLomba = expType === 'lomba';
  const isOrganisasi = expType === 'organisasi';

  // Sync form values when dialog opens/changes target
  useEffect(() => {
    if (open) {
      reset(
        initial
          ? {
              experience_type: initial.experience_type ?? 'kerja',
              competition_level: initial.competition_level ?? null,
              competition_rank: initial.competition_rank ?? null,
              organization_scope: initial.organization_scope ?? null,
              company: initial.company ?? null,
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

  // Clear type-specific fields when switching experience_type
  useEffect(() => {
    if (isKerja || isOrganisasi) {
      setValue('competition_level', null);
      setValue('competition_rank', null);
    }
    if (isKerja || isLomba) {
      setValue('organization_scope', null);
    }
    if (isLomba) {
      setValue('is_current', false);
      setValue('end_date', null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expType, setValue]);

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
          {/* Jenis Pengalaman */}
          <Field label="Jenis Pengalaman" error={errors.experience_type?.message} required>
            <select
              {...register('experience_type')}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              aria-invalid={!!errors.experience_type}
            >
              <option value="kerja">Pengalaman Kerja</option>
              <option value="lomba">Lomba / Kompetisi</option>
              <option value="organisasi">Organisasi</option>
            </select>
          </Field>

          {/* ── KERJA fields ── */}
          {isKerja && (
            <>
              <Field label="Nama Perusahaan / Instansi" error={errors.company?.message} required>
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

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('is_current')}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                <span className="text-sm">Masih bekerja di sini</span>
              </label>
            </>
          )}

          {/* ── LOMBA fields ── */}
          {isLomba && (
            <>
              <Field label="Nama Lomba / Kompetisi" error={errors.position?.message} required>
                <Input
                  {...register('position')}
                  placeholder="cth. Olimpiade Sains Nasional"
                  aria-invalid={!!errors.position}
                />
              </Field>

              <Field label="Penyelenggara" error={errors.company?.message}>
                <Input
                  {...register('company')}
                  placeholder="cth. Kemendikbud"
                  aria-invalid={!!errors.company}
                />
              </Field>

              <Field label="Tingkat Lomba" error={errors.competition_level?.message} required>
                <select
                  {...register('competition_level')}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  aria-invalid={!!errors.competition_level}
                >
                  <option value="">-- Pilih Tingkat --</option>
                  {COMPETITION_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Juara / Hasil" error={errors.competition_rank?.message} required>
                <Input
                  {...register('competition_rank')}
                  placeholder="cth. Juara 1, Finalis, Best Paper, Medali Emas"
                  aria-invalid={!!errors.competition_rank}
                />
              </Field>

              <Field label="Tanggal Pelaksanaan" error={errors.start_date?.message} required>
                <Input
                  {...register('start_date')}
                  type="date"
                  aria-invalid={!!errors.start_date}
                />
              </Field>
            </>
          )}

          {/* ── ORGANISASI fields ── */}
          {isOrganisasi && (
            <>
              <Field label="Nama Organisasi" error={errors.company?.message} required>
                <Input
                  {...register('company')}
                  placeholder="cth. BEM Fakultas, OSIS, Karang Taruna"
                  aria-invalid={!!errors.company}
                />
              </Field>

              <Field label="Jabatan / Peran" error={errors.position?.message} required>
                <Input
                  {...register('position')}
                  placeholder="cth. Ketua, Sekretaris, Anggota"
                  aria-invalid={!!errors.position}
                />
              </Field>

              <Field label="Lingkup Organisasi" error={errors.organization_scope?.message} required>
                <select
                  {...register('organization_scope')}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  aria-invalid={!!errors.organization_scope}
                >
                  <option value="">-- Pilih Lingkup --</option>
                  <option value="sekolah">Sekolah</option>
                  <option value="kampus">Kampus / Universitas</option>
                  <option value="eksternal">Eksternal / Masyarakat</option>
                </select>
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

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('is_current')}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                <span className="text-sm">Masih aktif di organisasi ini</span>
              </label>
            </>
          )}

          {/* Description — shown for all types */}
          <Field label="Deskripsi" error={errors.description?.message}>
            <Textarea
              {...register('description')}
              placeholder={
                isLomba
                  ? 'Ceritakan proses lomba atau pencapaian kamu...'
                  : isOrganisasi
                    ? 'Jelaskan peran dan kontribusi kamu...'
                    : 'Jelaskan tanggung jawab dan pencapaian kamu...'
              }
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

export function ExperienceForm({ resumeId }: ExperienceFormProps) {
  const [entries, setEntries] = useState<Experience[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Experience | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── AI Rewrite state ──
  const {
    status: rewriteStatus,
    result: rewriteResult,
    error: rewriteError,
    dispatch: dispatchRewriteJob,
    reset: resetRewriteJob,
  } = useAIJob();
  const [rewriteTargetId, setRewriteTargetId] = useState<string | null>(null);
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const rewriteInFlight =
    rewriteStatus === 'pending' || rewriteStatus === 'processing';

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

  // ── AI Rewrite handlers ──

  async function startAIRewrite(entry: Experience) {
    setDispatchError(null);
    setRewriteTargetId(entry.id);
    try {
      await dispatchRewriteJob(
        `/api/resumes/${resumeId}/experiences/${entry.id}/ai/rewrite`,
      );
    } catch (err: unknown) {
      resetRewriteJob();
      setRewriteTargetId(null);
      setDispatchError(
        extractApiErrorMessage(
          err,
          'Gagal memulai AI Rewrite. Periksa kuota harian Anda dan coba lagi.',
        ),
      );
    }
  }

  function handleRewriteConfirmed(text: string) {
    const id = rewriteTargetId;
    if (id) {
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, description: text } : e)),
      );
    }
    resetRewriteJob();
    setRewriteTargetId(null);
  }

  function handleRewriteCancel() {
    resetRewriteJob();
    setRewriteTargetId(null);
    setDispatchError(null);
  }

  function getTypeBadge(entry: Experience) {
    const type = entry.experience_type ?? 'kerja';
    if (type === 'lomba') {
      return (
        <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">
          Lomba
        </Badge>
      );
    }
    if (type === 'organisasi') {
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100">
          Organisasi
        </Badge>
      );
    }
    return <Badge variant="secondary">Kerja</Badge>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">Pengalaman</h3>
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

      {dispatchError && (
        <Alert variant="destructive">
          <AlertDescription>{dispatchError}</AlertDescription>
        </Alert>
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
          {entries.map((entry) => {
            const type = entry.experience_type ?? 'kerja';
            return (
              <li
                key={entry.id}
                className="rounded-lg border bg-card p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="font-medium text-sm truncate">{entry.position}</p>
                      {getTypeBadge(entry)}
                    </div>

                    {type === 'lomba' ? (
                      <div className="space-y-0.5">
                        {entry.company && (
                          <p className="text-sm text-muted-foreground">{entry.company}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {entry.competition_level && (
                            <span className="mr-2">Tingkat: {entry.competition_level}</span>
                          )}
                          {entry.competition_rank && (
                            <span>· {entry.competition_rank}</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">{entry.start_date}</p>
                      </div>
                    ) : type === 'organisasi' ? (
                      <div className="space-y-0.5">
                        <p className="text-sm text-muted-foreground">{entry.company}</p>
                        {entry.organization_scope && (
                          <p className="text-xs text-muted-foreground capitalize">
                            Lingkup: {entry.organization_scope === 'kampus' ? 'Kampus / Universitas' : entry.organization_scope === 'eksternal' ? 'Eksternal / Masyarakat' : 'Sekolah'}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {entry.start_date} – {entry.is_current ? 'Sekarang' : (entry.end_date ?? '—')}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        <p className="text-sm text-muted-foreground">{entry.company}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {entry.start_date} – {entry.is_current ? 'Sekarang' : (entry.end_date ?? '—')}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(entry)}
                      aria-label={`Edit pengalaman ${entry.position}`}
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(entry.id)}
                      disabled={deletingId === entry.id}
                      aria-label={`Hapus pengalaman ${entry.position}`}
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

                {/* AI Rewrite only for kerja type with a description */}
                {type === 'kerja' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startAIRewrite(entry)}
                    disabled={!entry.description || rewriteTargetId !== null}
                    className="text-xs"
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                    {rewriteTargetId === entry.id && (rewriteInFlight || rewriteStatus === 'completed')
                      ? 'Menulis Ulang...'
                      : 'AI Rewrite'}
                  </Button>
                )}

                {/* Inline AI Rewrite flow for the targeted entry */}
                {rewriteTargetId === entry.id && (
                  <div className="space-y-3 border-t pt-3">
                    {rewriteInFlight && <AIJobStatus status={rewriteStatus} />}

                    {rewriteStatus === 'failed' && (
                      <>
                        <AIJobStatus status={rewriteStatus} error={rewriteError} />
                        <Button variant="outline" size="sm" onClick={handleRewriteCancel}>
                          Tutup
                        </Button>
                      </>
                    )}

                    {rewriteStatus === 'completed' && rewriteResult !== null && (
                      <ExperienceRewriteConfirm
                        resumeId={resumeId}
                        experienceId={entry.id}
                        result={rewriteResult}
                        onConfirmed={handleRewriteConfirmed}
                        onCancel={handleRewriteCancel}
                      />
                    )}
                  </div>
                )}
              </li>
            );
          })}
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
