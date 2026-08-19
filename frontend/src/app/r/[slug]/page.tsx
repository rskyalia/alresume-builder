import type { Metadata } from 'next';
import type {
  Resume,
  Education,
  Experience,
  Skill,
  Project,
  Certificate,
} from '@/types/resume';

// --- Types

type PublicResume = Resume & {
  education: Education[];
  experience: Experience[];
  skills: Skill[];
  projects: Project[];
  certificates: Certificate[];
};

interface PublicResumeResponse {
  data: PublicResume;
}

// --- Data fetching

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

async function fetchPublicResume(slug: string): Promise<PublicResume | null> {
  try {
    const res = await fetch(`${API_URL}/api/r/${encodeURIComponent(slug)}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = (await res.json()) as PublicResumeResponse;
    return json.data;
  } catch {
    return null;
  }
}

// --- Metadata

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const resume = await fetchPublicResume(slug);
  if (!resume) return { title: 'Resume Tidak Ditemukan' };
  return {
    title: resume.full_name ? `${resume.full_name} -- Resume` : resume.title,
  };
}

// --- Helpers

function formatDateRange(
  startDate: string,
  endDate: string | null,
  isCurrent?: boolean,
): string {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('id-ID', { year: 'numeric', month: 'short' });
  const start = fmt(startDate);
  const end = isCurrent ? 'Sekarang' : endDate ? fmt(endDate) : 'Sekarang';
  return `${start} - ${end}`;
}

const SKILL_LEVEL_LABEL: Record<string, string> = {
  beginner: 'Pemula',
  intermediate: 'Menengah',
  advanced: 'Mahir',
};

// --- Page

export default async function PublicResumePage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const resume = await fetchPublicResume(slug);

  if (!resume) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">
            Resume tidak ditemukan
          </h1>
          <p className="text-sm text-muted-foreground">
            Resume ini mungkin sudah tidak tersedia atau URL tidak valid.
          </p>
        </div>
      </main>
    );
  }

  const hasEducation = resume.education && resume.education.length > 0;
  const hasExperience = resume.experience && resume.experience.length > 0;
  const hasSkills = resume.skills && resume.skills.length > 0;
  const hasProjects = resume.projects && resume.projects.length > 0;
  const hasCertificates = resume.certificates && resume.certificates.length > 0;

  return (
    <main className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-8">

        <header className="space-y-1 border-b pb-6">
          <h1 className="text-3xl font-bold text-foreground">
            {resume.full_name ?? resume.title}
          </h1>
          {(resume.phone || resume.address) && (
            <p className="text-sm text-muted-foreground">
              {[resume.phone, resume.address].filter(Boolean).join(' - ')}
            </p>
          )}
        </header>

        {resume.summary && (
          <section aria-labelledby="summary-heading">
            <h2 id="summary-heading" className="text-lg font-semibold text-foreground mb-2">
              Ringkasan
            </h2>
            <p className="text-sm text-foreground leading-relaxed">
              {resume.summary}
            </p>
          </section>
        )}

        {hasEducation && (
          <section aria-labelledby="education-heading">
            <h2 id="education-heading" className="text-lg font-semibold text-foreground mb-3">
              Pendidikan
            </h2>
            <ul className="space-y-4">
              {resume.education.map((edu: Education) => (
                <li key={edu.id}>
                  <div className="flex justify-between items-start gap-2 flex-wrap">
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        {edu.degree}{edu.field_of_study ? ` - ${edu.field_of_study}` : ''}
                      </p>
                      <p className="text-sm text-muted-foreground">{edu.institution}</p>
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDateRange(edu.start_date, edu.end_date)}
                    </p>
                  </div>
                  {edu.gpa && (
                    <p className="text-xs text-muted-foreground mt-0.5">IPK: {edu.gpa}</p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {hasExperience && (
          <section aria-labelledby="experience-heading">
            <h2 id="experience-heading" className="text-lg font-semibold text-foreground mb-3">
              Pengalaman
            </h2>
            <ul className="space-y-5">
              {resume.experience.map((exp: Experience) => (
                <li key={exp.id}>
                  <div className="flex justify-between items-start gap-2 flex-wrap">
                    <div>
                      <p className="font-medium text-foreground text-sm">{exp.position}</p>
                      <p className="text-sm text-muted-foreground">{exp.company}</p>
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDateRange(exp.start_date, exp.end_date, exp.is_current)}
                    </p>
                  </div>
                  {exp.description && (
                    <p className="text-sm text-foreground mt-1.5 leading-relaxed whitespace-pre-line">
                      {exp.description}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {hasSkills && (
          <section aria-labelledby="skills-heading">
            <h2 id="skills-heading" className="text-lg font-semibold text-foreground mb-3">
              Skill
            </h2>
            <ul className="flex flex-wrap gap-2" aria-label="Daftar skill">
              {resume.skills.map((skill: Skill) => (
                <li
                  key={skill.id}
                  className="rounded-full border px-3 py-1 text-xs font-medium text-foreground"
                >
                  {skill.name}
                  {skill.level && (
                    <span className="ml-1 text-muted-foreground font-normal">
                      {' '}- {SKILL_LEVEL_LABEL[skill.level] ?? skill.level}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {hasProjects && (
          <section aria-labelledby="projects-heading">
            <h2 id="projects-heading" className="text-lg font-semibold text-foreground mb-3">
              Proyek
            </h2>
            <ul className="space-y-4">
              {resume.projects.map((project: Project) => (
                <li key={project.id}>
                  <div className="flex justify-between items-start gap-2 flex-wrap">
                    <p className="font-medium text-foreground text-sm">
                      {project.url ? (
                        <a
                          href={project.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline underline-offset-2 hover:text-primary"
                        >
                          {project.name}
                        </a>
                      ) : (
                        project.name
                      )}
                    </p>
                    {project.tech_stack && (
                      <p className="text-xs text-muted-foreground">{project.tech_stack}</p>
                    )}
                  </div>
                  {project.description && (
                    <p className="text-sm text-foreground mt-1 leading-relaxed">
                      {project.description}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {hasCertificates && (
          <section aria-labelledby="certificates-heading">
            <h2 id="certificates-heading" className="text-lg font-semibold text-foreground mb-3">
              Sertifikat
            </h2>
            <ul className="space-y-3">
              {resume.certificates.map((cert: Certificate) => (
                <li key={cert.id}>
                  <div className="flex justify-between items-start gap-2 flex-wrap">
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        {cert.credential_url ? (
                          <a
                            href={cert.credential_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline underline-offset-2 hover:text-primary"
                          >
                            {cert.name}
                          </a>
                        ) : (
                          cert.name
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{cert.issuer}</p>
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(cert.issue_date).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

      </div>
    </main>
  );
}