'use client';

import React from 'react';

import type { Resume } from '@/types/resume';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';

import { PersonalInfoForm } from '@/components/resume/PersonalInfoForm';
import { EducationForm } from '@/components/resume/EducationForm';
import { ExperienceForm } from '@/components/resume/ExperienceForm';
import { SkillsForm } from '@/components/resume/SkillsForm';
import { ProjectsForm } from '@/components/resume/ProjectsForm';
import { CertificatesForm } from '@/components/resume/CertificatesForm';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ResumeFormTabsProps {
  resumeId: string;
  resume: Resume;
  onResumeUpdated: (updated: Resume) => void;
}

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS = [
  { value: 'personal', label: 'Info Pribadi' },
  { value: 'education', label: 'Pendidikan' },
  { value: 'experience', label: 'Pengalaman' },
  { value: 'skills', label: 'Skill' },
  { value: 'projects', label: 'Proyek' },
  { value: 'certificates', label: 'Sertifikat' },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function ResumeFormTabs({
  resumeId,
  resume,
  onResumeUpdated,
}: ResumeFormTabsProps) {
  return (
    <Tabs defaultValue="personal" className="space-y-4">
      {/* Tab navigation — scrollable on small screens */}
      <TabsList className="flex h-auto flex-wrap gap-1 bg-muted p-1">
        {TABS.map(({ value, label }) => (
          <TabsTrigger key={value} value={value} className="flex-shrink-0">
            {label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="personal">
        <PersonalInfoForm
          resumeId={resumeId}
          resume={resume}
          onSaved={onResumeUpdated}
        />
      </TabsContent>

      <TabsContent value="education">
        <EducationForm resumeId={resumeId} />
      </TabsContent>

      <TabsContent value="experience">
        <ExperienceForm resumeId={resumeId} />
      </TabsContent>

      <TabsContent value="skills">
        <SkillsForm resumeId={resumeId} />
      </TabsContent>

      <TabsContent value="projects">
        <ProjectsForm resumeId={resumeId} />
      </TabsContent>

      <TabsContent value="certificates">
        <CertificatesForm resumeId={resumeId} />
      </TabsContent>
    </Tabs>
  );
}

export default ResumeFormTabs;
