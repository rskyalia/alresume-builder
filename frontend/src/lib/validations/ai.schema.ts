import { z } from 'zod';

export const coverLetterSchema = z.object({
  resume_id: z.string().uuid('Resume ID tidak valid'),
  job_title: z.string().min(1, 'Judul pekerjaan tidak boleh kosong').max(200),
  company_name: z.string().min(1, 'Nama perusahaan tidak boleh kosong').max(200),
  job_description: z
    .string()
    .min(10, 'Deskripsi pekerjaan minimal 10 karakter')
    .max(5000, 'Deskripsi pekerjaan maksimal 5000 karakter'),
  tone: z
    .enum(['professional', 'friendly', 'enthusiastic'])
    .optional()
    .default('professional'),
});

export type CoverLetterInput = z.infer<typeof coverLetterSchema>;
