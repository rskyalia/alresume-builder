# PRD — AI Resume Builder (v0.1)

## 1. Problem Statement

Fresh graduate dan mahasiswa kesulitan membuat CV yang profesional dan lolos ATS,
karena minim pengalaman kerja dan tidak tahu cara menuliskan skill akademik/organisasi/magang
menjadi poin yang menarik bagi recruiter.

## 2. Target User

Fresh graduate & mahasiswa tingkat akhir.

## 3. MVP Scope

| Fitur | Keterangan |
|---|---|
| Login/Register | Auth dasar (Sanctum) |
| Dashboard | List resume milik user |
| Resume Builder | Form: Personal Info, Education, Experience, Skills, Projects |
| AI Summary | Generate ringkasan profil otomatis |
| AI Experience | Bantu tulis ulang deskripsi pengalaman |
| Export PDF | Download hasil resume |
| Sistem kredit | 5 resume gratis, selanjutnya berlangganan |

## 4. Monetization Rules

- User baru: `resume_credits = 5`, `plan = free`.
- 1 kredit dipotong setiap kali **resume baru dibuat** (bukan saat edit/export).
- Resume yang sudah ada tetap bisa diedit dan di-export tanpa batas meski kredit habis.
- User dengan `plan = pro` (berlangganan aktif) tidak dibatasi kredit.
- Riwayat langganan dicatat di tabel `subscriptions`.

## 5. Out of Scope (v0.1)

- Multi-bahasa resume
- Kolaborasi/review resume oleh orang lain
- Integrasi job board / apply langsung

## 6. Tech Stack

- Frontend: Next.js, TypeScript, TailwindCSS, shadcn/ui, React Hook Form, Zod
- Backend: Laravel 12, REST API, Sanctum
- Database: PostgreSQL
- AI: Gemini API / OpenAI
- Deployment: Vercel + Railway

## 7. Success Metrics (draft)

- Jumlah resume berhasil dibuat & di-export
- Conversion rate free → paid setelah kredit habis
- Retention: user membuat resume kedua dalam 7 hari
