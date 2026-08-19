<?php

namespace App\Services;

use App\Models\Experience;
use App\Models\Resume;

class PromptBuilder
{
    /**
     * Build a prompt for generating a professional summary from a resume.
     */
    public static function buildSummaryPrompt(Resume $resume): string
    {
        $resume->loadMissing(['education', 'experience', 'skills']);

        $education = $resume->education->map(
            fn ($e) => "{$e->degree} in {$e->field_of_study} at {$e->institution}"
        )->join(', ');

        $experience = $resume->experience->map(
            fn ($e) => "{$e->position} at {$e->company}"
        )->join(', ');

        $skills = $resume->skills->pluck('name')->join(', ');

        return <<<PROMPT
        Tulis ringkasan profesional dalam Bahasa Indonesia untuk kandidat berikut.
        Nama: {$resume->full_name}
        Pendidikan: {$education}
        Pengalaman: {$experience}
        Skills: {$skills}
        
        Buat ringkasan 2-3 kalimat yang menonjolkan keahlian dan pengalaman utama. Gunakan sudut pandang orang pertama.
        PROMPT;
    }

    /**
     * Build a prompt for rewriting a job experience entry in STAR format.
     */
    public static function buildExperienceRewritePrompt(Experience $exp): string
    {
        return <<<PROMPT
        Tulis ulang deskripsi pekerjaan berikut dalam format STAR (Situation, Task, Action, Result) untuk CV profesional.
        
        Posisi: {$exp->position}
        Perusahaan: {$exp->company}
        Deskripsi saat ini: {$exp->description}
        
        Ketentuan:
        - Minimal 3 bullet points
        - Mulai setiap bullet dengan action verb kuat
        - Sertakan angka/metrik jika memungkinkan
        - Bahasa Indonesia profesional
        - Format: bullet points dengan tanda "•"
        PROMPT;
    }

    /**
     * Build a prompt for scoring the resume against ATS criteria.
     */
    public static function buildATSPrompt(Resume $resume): string
    {
        $resume->loadMissing(['education', 'experience', 'skills', 'certificates']);

        $sections = json_encode([
            'full_name'    => $resume->full_name,
            'summary'      => $resume->summary,
            'education'    => $resume->education->toArray(),
            'experience'   => $resume->experience->toArray(),
            'skills'       => $resume->skills->pluck('name')->toArray(),
            'certificates' => $resume->certificates->pluck('name')->toArray(),
        ], JSON_UNESCAPED_UNICODE);

        return <<<PROMPT
        Analisis CV berikut dan berikan skor ATS (Applicant Tracking System) dari 0-100.
        
        Data CV:
        {$sections}
        
        Kembalikan HANYA JSON valid dengan format:
        {
            "score": <angka 0-100>,
            "recommendations": [<string rekomendasi 1>, <string rekomendasi 2>, ...]
        }
        
        Pertimbangkan: kelengkapan data, penggunaan kata kunci, format tanggal, deskripsi pengalaman, skills relevan.
        PROMPT;
    }

    /**
     * Build a prompt for generating a cover letter for a specific company and position.
     */
    public static function buildCoverLetterPrompt(Resume $resume, string $company, string $position): string
    {
        $resume->loadMissing(['experience', 'skills']);

        $experience = $resume->experience->map(
            fn ($e) => "{$e->position} di {$e->company}"
        )->join(', ');

        $skills = $resume->skills->pluck('name')->take(5)->join(', ');

        return <<<PROMPT
        Tulis surat lamaran kerja profesional dalam Bahasa Indonesia.
        
        Pelamar: {$resume->full_name}
        Melamar ke: {$company} — posisi {$position}
        Pengalaman: {$experience}
        Skills utama: {$skills}
        
        Format surat lamaran formal: pembuka, paragraf utama (2-3 paragraf), penutup.
        Panjang: 200-350 kata. Gunakan Bahasa Indonesia formal dan profesional.
        PROMPT;
    }
}
