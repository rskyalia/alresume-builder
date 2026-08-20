/**
 * TypeScript types for resume-related entities.
 * These mirror the backend database schema.
 */

export interface Education {
  id: string;
  resume_id: string;
  education_level?: 'sma' | 'perguruan_tinggi' | null;
  institution: string;
  degree: string;
  field_of_study: string;
  start_date: string; // ISO date string: YYYY-MM-DD
  end_date: string | null;
  gpa: string | null;
  created_at: string;
  updated_at: string;
}

export interface Experience {
  id: string;
  resume_id: string;
  experience_type?: 'kerja' | 'lomba' | 'organisasi' | null;
  competition_level?: string | null;
  competition_rank?: string | null;
  organization_scope?: 'sekolah' | 'kampus' | 'eksternal' | null;
  company: string;
  position: string;
  start_date: string; // ISO date string: YYYY-MM-DD
  end_date: string | null;
  is_current: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Skill {
  id: string;
  resume_id: string;
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  resume_id: string;
  name: string;
  description: string | null;
  url: string | null;
  tech_stack: string | null;
  created_at: string;
  updated_at: string;
}

export interface Certificate {
  id: string;
  resume_id: string;
  certificate_type?: 'keahlian' | 'prestasi' | 'kegiatan' | null;
  name: string;
  issuer: string;
  issue_date: string; // ISO date string: YYYY-MM-DD
  credential_url: string | null;
  file_path?: string | null;
  file_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Resume {
  id: string;
  user_id: string;
  title: string;
  template: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  summary: string | null;
  photo_url?: string | null;
  is_public: boolean;
  public_slug: string | null;
  created_at: string;
  updated_at: string;
  // Relations (populated when requested)
  education?: Education[];
  experience?: Experience[];
  skills?: Skill[];
  projects?: Project[];
  certificates?: Certificate[];
}
