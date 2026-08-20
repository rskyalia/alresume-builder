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

export interface ResumeFormTabsProps {
  resumeId: string;
  resume: Resume;
  onResumeUpdated: (updated: Resume) => void;
}

const TABS = [
  { value: 'personal', label: 'Info Pribadi' },
  { value: 'education', label: 'Pendidikan' },
  { value: 'experience', label: 'Pengalaman' },
  { value: 'skills', label: 'Skill' },
  { value: 'projects', label: 'Proyek' },
  { value: 'certificates', label: 'Sertifikat' },
] as const;

export function ResumeFormTabs({
  resumeId,
  resume,
  onResumeUpdated,
}: ResumeFormTabsProps) {
  return (
    <Tabs defaultValue="personal" className="space-y-4">
      <TabsList className="flex h-auto flex-wrap gap-1 bg-muted p-1">
        {TABS.map(({ value, label }) => (
          <TabsTrigger key={value} value={value} className="flex-shrink-0">
            {label}
          </TabsTrigger>
        ))}
      </TabsList>

      {/* forceMount: keep components mounted when switching tabs so state/data is preserved */}
      <TabsContent value="personal" forceMount className="data-[state=inactive]:hidden">
        <PersonalInfoForm
          resumeId={resumeId}
          resume={resume}
          onSaved={onResumeUpdated}
        />
      </TabsContent>

      <TabsContent value="education" forceMount className="data-[state=inactive]:hidden">
        <EducationForm resumeId={resumeId} />
      </TabsContent>

      <TabsContent value="experience" forceMount className="data-[state=inactive]:hidden">
        <ExperienceForm resumeId={resumeId} />
      </TabsContent>

      <TabsContent value="skills" forceMount className="data-[state=inactive]:hidden">
        <SkillsForm resumeId={resumeId} />
      </TabsContent>

      <TabsContent value="projects" forceMount className="data-[state=inactive]:hidden">
        <ProjectsForm resumeId={resumeId} />
      </TabsContent>

      <TabsContent value="certificates" forceMount className="data-[state=inactive]:hidden">
        <CertificatesForm resumeId={resumeId} />
      </TabsContent>
    </Tabs>
  );
}

export default ResumeFormTabs;
