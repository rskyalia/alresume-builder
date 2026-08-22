import { describe, expect, it } from 'vitest';
import {
  certificateSchema,
  educationSchema,
  experienceSchema,
  personalInfoSchema,
  projectSchema,
  skillSchema,
} from '../resume.schema';

describe('personalInfoSchema', () => {
  it('menerima data lengkap', () => {
    const result = personalInfoSchema.safeParse({
      title: 'CV Saya',
      full_name: 'Budi Santoso',
      template: 'ats-friendly',
    });
    expect(result.success).toBe(true);
  });

  it('menolak title kosong', () => {
    const result = personalInfoSchema.safeParse({
      title: '',
      full_name: 'Budi',
      template: 'ats-friendly',
    });
    expect(result.success).toBe(false);
  });
});

describe('educationSchema', () => {
  const base = { institution: 'Universitas Indonesia', start_date: '2020-08-01' };

  it('menerima end_date >= start_date', () => {
    const result = educationSchema.safeParse({ ...base, end_date: '2024-07-31' });
    expect(result.success).toBe(true);
  });

  it('menolak end_date < start_date', () => {
    const result = educationSchema.safeParse({ ...base, end_date: '2019-01-01' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path[0]).toBe('end_date');
    }
  });
});

describe('experienceSchema', () => {
  const base = { position: 'Software Engineer', start_date: '2022-01-01', is_current: false };

  it('menolak end_date < start_date saat tidak bekerja saat ini', () => {
    const result = experienceSchema.safeParse({ ...base, end_date: '2021-01-01' });
    expect(result.success).toBe(false);
  });

  it('mengabaikan urutan tanggal saat is_current true', () => {
    const result = experienceSchema.safeParse({
      ...base,
      is_current: true,
      end_date: '2021-01-01',
    });
    expect(result.success).toBe(true);
  });

  it('menolak position kosong', () => {
    const result = experienceSchema.safeParse({
      ...base,
      position: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('skillSchema', () => {
  it('menerima level yang valid', () => {
    expect(skillSchema.safeParse({ name: 'React', level: 'advanced' }).success).toBe(true);
  });

  it('menolak level di luar enum', () => {
    expect(skillSchema.safeParse({ name: 'React', level: 'expert' }).success).toBe(false);
  });
});

describe('projectSchema', () => {
  const base = { name: 'Portal Berita' };

  it('menerima url kosong', () => {
    expect(projectSchema.safeParse({ ...base, url: '' }).success).toBe(true);
  });

  it('menerima url valid', () => {
    expect(
      projectSchema.safeParse({ ...base, url: 'https://contoh.id' }).success
    ).toBe(true);
  });

  it('menolak format url salah', () => {
    expect(projectSchema.safeParse({ ...base, url: 'bukan-url' }).success).toBe(false);
  });
});

describe('certificateSchema', () => {
  const base = { name: 'AWS CCSP', issue_date: '2024-05-01' };

  it('menerima sertifikat lengkap', () => {
    expect(certificateSchema.safeParse(base).success).toBe(true);
  });

  it('menolak issue_date kosong', () => {
    expect(certificateSchema.safeParse({ ...base, issue_date: '' }).success).toBe(false);
  });
});
