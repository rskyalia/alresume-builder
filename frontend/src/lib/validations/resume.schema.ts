import { z } from 'zod';

// ---------------------------------------------------------------------------
// Personal Info
// ---------------------------------------------------------------------------

export const personalInfoSchema = z.object({
  title: z.string().min(1, 'Judul resume tidak boleh kosong').max(100),
  full_name: z.string().min(1, 'Nama lengkap tidak boleh kosong').max(100),
  phone: z.string().max(20).optional().nullable(),
  address: z.string().max(255).optional().nullable(),
  summary: z.string().max(2000).optional().nullable(),
  template: z.string(),
});

export type PersonalInfoInput = z.infer<typeof personalInfoSchema>;

// ---------------------------------------------------------------------------
// Education
// ---------------------------------------------------------------------------

export const educationSchema = z
  .object({
    institution: z.string().min(1, 'Nama institusi tidak boleh kosong').max(200),
    degree: z.string().min(1, 'Gelar tidak boleh kosong').max(100),
    field_of_study: z.string().min(1, 'Bidang studi tidak boleh kosong').max(100),
    start_date: z.string().min(1, 'Tanggal mulai tidak boleh kosong'),
    end_date: z.string().optional().nullable(),
    gpa: z.string().max(10).optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.end_date && data.start_date) {
        return new Date(data.end_date) >= new Date(data.start_date);
      }
      return true;
    },
    {
      message: 'Tanggal selesai harus lebih besar atau sama dengan tanggal mulai',
      path: ['end_date'],
    }
  );

export type EducationInput = z.infer<typeof educationSchema>;

// ---------------------------------------------------------------------------
// Experience
// ---------------------------------------------------------------------------

export const experienceSchema = z
  .object({
    company: z.string().min(1, 'Nama perusahaan tidak boleh kosong').max(200),
    position: z.string().min(1, 'Posisi tidak boleh kosong').max(100),
    start_date: z.string().min(1, 'Tanggal mulai tidak boleh kosong'),
    end_date: z.string().optional().nullable(),
    is_current: z.boolean(),
    description: z.string().max(2000).optional().nullable(),
  })
  .refine(
    (data) => {
      if (!data.is_current && data.end_date && data.start_date) {
        return new Date(data.end_date) >= new Date(data.start_date);
      }
      return true;
    },
    {
      message: 'Tanggal selesai harus lebih besar atau sama dengan tanggal mulai',
      path: ['end_date'],
    }
  );

export type ExperienceInput = z.infer<typeof experienceSchema>;

// ---------------------------------------------------------------------------
// Skill
// ---------------------------------------------------------------------------

export const skillSchema = z.object({
  name: z.string().min(1, 'Nama skill tidak boleh kosong').max(100),
  level: z.enum(['beginner', 'intermediate', 'advanced'], {
    error: 'Level harus salah satu dari: beginner, intermediate, advanced',
  }),
});

export type SkillInput = z.infer<typeof skillSchema>;

// ---------------------------------------------------------------------------
// Project
// ---------------------------------------------------------------------------

export const projectSchema = z.object({
  name: z.string().min(1, 'Nama proyek tidak boleh kosong').max(200),
  description: z.string().max(2000).optional().nullable(),
  url: z.string().url('Format URL tidak valid').optional().nullable().or(z.literal('')),
  tech_stack: z.string().max(500).optional().nullable(),
});

export type ProjectInput = z.infer<typeof projectSchema>;

// ---------------------------------------------------------------------------
// Certificate
// ---------------------------------------------------------------------------

export const certificateSchema = z.object({
  name: z.string().min(1, 'Nama sertifikat tidak boleh kosong').max(200),
  issuer: z.string().min(1, 'Nama penerbit tidak boleh kosong').max(200),
  issue_date: z.string().min(1, 'Tanggal penerbitan tidak boleh kosong'),
  credential_url: z
    .string()
    .url('Format URL tidak valid')
    .optional()
    .nullable()
    .or(z.literal('')),
});

export type CertificateInput = z.infer<typeof certificateSchema>;
