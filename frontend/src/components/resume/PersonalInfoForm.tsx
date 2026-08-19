'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import type { Resume } from '@/types/resume';
import {
  personalInfoSchema,
  type PersonalInfoInput,
} from '@/lib/validations/resume.schema';
import apiClient from '@/lib/api-client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface PersonalInfoFormProps {
  resumeId: string;
  resume: Resume;
  /** Called after a successful save with the updated resume data. */
  onSaved?: (updated: Resume) => void;
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

export function PersonalInfoForm({ resumeId, resume, onSaved }: PersonalInfoFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<PersonalInfoInput>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      title: resume.title ?? '',
      full_name: resume.full_name ?? '',
      phone: resume.phone ?? '',
      address: resume.address ?? '',
      summary: resume.summary ?? '',
      template: resume.template ?? 'default',
    },
  });

  async function onSubmit(data: PersonalInfoInput) {
    setSaveError(null);
    setSaveSuccess(false);
    setIsSaving(true);
    try {
      const res = await apiClient.patch<{ data: Resume }>(
        `/api/resumes/${resumeId}`,
        data,
      );
      setSaveSuccess(true);
      onSaved?.(res.data.data);
      // Clear success indicator after 2s
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Gagal menyimpan. Coba lagi.';
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <Field label="Judul Resume" error={errors.title?.message} required>
        <Input
          {...register('title')}
          placeholder="cth. Software Engineer Resume"
          aria-invalid={!!errors.title}
        />
      </Field>

      <Field label="Nama Lengkap" error={errors.full_name?.message} required>
        <Input
          {...register('full_name')}
          placeholder="cth. Budi Santoso"
          aria-invalid={!!errors.full_name}
        />
      </Field>

      <Field label="Nomor Telepon" error={errors.phone?.message}>
        <Input
          {...register('phone')}
          type="tel"
          placeholder="cth. +62 812 3456 7890"
          aria-invalid={!!errors.phone}
        />
      </Field>

      <Field label="Alamat" error={errors.address?.message}>
        <Input
          {...register('address')}
          placeholder="cth. Jakarta, Indonesia"
          aria-invalid={!!errors.address}
        />
      </Field>

      <Field label="Ringkasan Profil" error={errors.summary?.message}>
        <Textarea
          {...register('summary')}
          placeholder="Tulis ringkasan profil profesional kamu..."
          className="min-h-25 resize-y"
          aria-invalid={!!errors.summary}
        />
        <p className="text-xs text-muted-foreground">
          Bisa diisi otomatis menggunakan fitur AI Summary.
        </p>
      </Field>

      {saveError && (
        <p className="text-sm text-destructive" role="alert">
          {saveError}
        </p>
      )}

      {saveSuccess && (
        <p className="text-sm text-green-600" role="status">
          Tersimpan!
        </p>
      )}

      <Button type="submit" disabled={isSaving || !isDirty}>
        {isSaving ? 'Menyimpan...' : 'Simpan'}
      </Button>
    </form>
  );
}

export default PersonalInfoForm;
