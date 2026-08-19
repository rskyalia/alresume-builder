# Implementation Plan: AI Resume Builder (AlresumeBuilder)

## Overview

Implementasi MVP AlresumeBuilder secara incremental: mulai dari setup infrastruktur backend (Laravel + Sanctum + migrasi baru) dan frontend (Next.js + shadcn/ui + axios), lalu core features (auth, resume CRUD, sections), kemudian AI features (Queue + polling), diikuti PDF export, share URL, dashboard, dan subscription/credit management. Property-based tests ditempatkan dekat dengan implementasinya agar error terdeteksi lebih awal.

---

## Tasks

- [x] 1. Setup Backend Laravel

  - [x] 1.1 Inisialisasi proyek Laravel 12 dan install Sanctum
    - Jalankan `composer create-project laravel/laravel . "12.*"` di folder `backend/`
    - Jalankan `composer require laravel/sanctum` dan `php artisan install:api`
    - Konfigurasi `config/cors.php`: set `allowed_origins` ke `FRONTEND_URL`, aktifkan `supports_credentials: true`
    - Tambahkan `SANCTUM_STATEFUL_DOMAINS` dan `SESSION_DOMAIN` di `.env`
    - _Requirements: 1.1, 1.3_

  - [x] 1.2 Konfigurasi koneksi PostgreSQL dan environment variables
    - Set `DB_CONNECTION=pgsql` di `.env` beserta `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`
    - Set `QUEUE_CONNECTION=database`, `CACHE_DRIVER=database` di `.env`
    - Set `GEMINI_API_KEY`, `OPENAI_API_KEY`, `FRONTEND_URL`, `APP_URL` di `.env`
    - _Requirements: 4.1, 5.1, 6.1, 7.1_

  - [x] 1.3 Buat migration `create_ai_jobs_table`
    - Buat file `2024_01_01_000009_create_ai_jobs_table.php`
    - Kolom: `id` UUID PK, `user_id` UUID FK cascade delete, `resume_id` UUID FK cascade delete, `type` VARCHAR, `status` VARCHAR default `pending`, `payload` JSONB null, `result` TEXT null, `error_message` TEXT null, timestamps
    - _Requirements: 11.1_

  - [x] 1.4 Buat migration `create_pdf_templates_table`
    - Buat file `2024_01_01_000010_create_pdf_templates_table.php`
    - Kolom: `id` UUID PK, `name` VARCHAR, `slug` VARCHAR UNIQUE, `description` VARCHAR null, `is_pro` BOOLEAN default false, `html_path` VARCHAR, `thumbnail` VARCHAR null, timestamps
    - _Requirements: 8.2, 8.4_

  - [x] 1.5 Buat migration `create_daily_ai_usage_table`
    - Buat file `2024_01_01_000011_create_daily_ai_usage_table.php`
    - Kolom: `id` UUID PK, `user_id` UUID FK cascade delete, `type` VARCHAR, `usage_date` DATE, `count` INTEGER default 0, timestamps
    - Tambahkan UNIQUE constraint pada `(user_id, type, usage_date)`
    - _Requirements: 4.7, 5.7, 6.4, 7.5_

  - [x] 1.6 Jalankan semua migrasi dan buat seeder `PdfTemplateSeeder`
    - Jalankan `php artisan migrate`
    - Buat `PdfTemplateSeeder` yang menyeed 2 template: `ATS Friendly` (slug `default`, `is_pro=false`) dan `Modern Visual` (slug `modern`, `is_pro=true`)
    - Simpan file HTML template di `resources/pdf-templates/default.html` dan `resources/pdf-templates/modern.html`
    - Jalankan `php artisan db:seed`
    - _Requirements: 8.2, 8.4_


- [x] 2. Setup Frontend Next.js
  - [x] 2.1 Inisialisasi shadcn/ui dan install komponen dasar
    - Jalankan `npx shadcn@latest init` di folder `frontend/`
    - Install komponen: `button`, `input`, `card`, `badge`, `dialog`, `progress`, `textarea`, `tabs`, `separator`, `skeleton`, `alert`
    - _Requirements: (semua UI requirements)_

  - [x] 2.2 Setup API client (axios + CSRF interceptor)
    - Buat `frontend/src/lib/api-client.ts` dengan instance axios: `baseURL=NEXT_PUBLIC_API_URL`, `withCredentials: true`, header `Accept: application/json`
    - Tambahkan request interceptor: ambil `XSRF-TOKEN` dari cookie dan set header `X-XSRF-TOKEN`; jika token belum ada, GET `/sanctum/csrf-cookie` terlebih dahulu
    - Tambahkan response interceptor: redirect ke `/login` jika status 401
    - Install `npm install axios js-cookie` dan `npm install --save-dev @types/js-cookie`
    - _Requirements: 1.1, 1.3, 1.6_

  - [x] 2.3 Buat tipe TypeScript dan Zod validation schemas
    - Buat `frontend/src/types/api.ts` (response envelope types: `ApiResponse<T>`, `ApiError`)
    - Buat `frontend/src/types/resume.ts` (tipe `Resume`, `Education`, `Experience`, `Skill`, `Project`, `Certificate`)
    - Buat `frontend/src/types/ai-job.ts` (tipe `AiJob`, `AiJobStatus`)
    - Buat `frontend/src/lib/validations/auth.schema.ts` (Zod: register, login)
    - Buat `frontend/src/lib/validations/resume.schema.ts` (Zod: personalInfo, education dengan date refine, experience dengan date refine, skill, project, certificate)
    - Buat `frontend/src/lib/validations/ai.schema.ts` (Zod: coverLetter input)
    - _Requirements: 1.1, 3.4–3.9, 3.11_

  - [x] 2.4 Buat utility functions
    - Buat `frontend/src/lib/utils.ts` dengan fungsi `cn()` (class merge), `formatDate()`, `truncate()`, `getCookie()`
    - _Requirements: (semua halaman)_


- [x] 3. Backend Autentikasi
  - [x] 3.1 Buat model `AiJob`, `PdfTemplate`, dan `DailyAiUsage`
    - Buat `app/Models/AiJob.php` dengan `$fillable`, relasi `belongsTo(User)` dan `belongsTo(Resume)`, cast `payload` sebagai array
    - Buat `app/Models/PdfTemplate.php` dengan `$fillable` dan scope `forUser(User $user)`
    - Buat `app/Models/DailyAiUsage.php` dengan `$fillable` dan unique key `(user_id, type, usage_date)`
    - Update `app/Models/User.php`: tambahkan `hasMany(AiJob)`, `hasMany(DailyAiUsage)`, method `isPro()`, `hasResumeCredits()`, `decrementResumeCredit()`
    - Update `app/Models/Resume.php`: tambahkan `hasMany(AiJob)`, relasi ke semua sections sudah ada
    - _Requirements: 1.1, 3.1, 4.1, 10.1, 11.1_

  - [x] 3.2 Buat custom exceptions dan error handler
    - Buat `app/Exceptions/InsufficientCreditsException.php`
    - Buat `app/Exceptions/RateLimitExceededException.php`
    - Buat `app/Exceptions/ForbiddenException.php`
    - Update `app/Exceptions/Handler.php`: tambahkan method `handleApiExceptions()` yang memetakan setiap exception ke respons JSON dengan HTTP status yang sesuai (403, 429, 404, 422)
    - _Requirements: 1.2, 1.4, 3.2, 4.7, 6.4, 8.3_

  - [x] 3.3 Buat `AuthController` dan `AuthService`
    - Buat `app/Services/AuthService.php` dengan method `register(array $data): array` (buat user, set plan=free, credits=5, return token) dan `login(array $credentials): array`
    - Buat `app/Http/Controllers/AuthController.php` dengan method `register()` (validasi: name required, email unique, password min:8 → 201), `login()` (validasi credentials → 200 atau 401), `logout()` (revoke token → 200), `me()` (return user saat ini → 200)
    - Daftarkan routes di `routes/api.php`: `POST /auth/register`, `POST /auth/login`, `POST /auth/logout` (middleware auth:sanctum), `GET /auth/me` (middleware auth:sanctum)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [x] 3.4 Tulis property test untuk autentikasi (Properties 1 & 2)
    - **Property 1:** Untuk semua kombinasi `name`, `email` unik, `password` valid (≥8 karakter), registrasi harus menghasilkan user dengan `plan='free'` dan `resume_credits=5`
    - **Property 2:** Untuk semua protected endpoints, request tanpa token valid harus selalu mendapatkan respons 401
    - Gunakan Pest PHP + `LazilyRefreshDatabase`; generate random valid inputs dengan faker
    - **Validates: Requirements 1.1, 1.6, 1.7, 10.1**


- [x] 4. Backend Credit & Subscription Service
  - [x] 4.1 Buat `CreditService`
    - Buat `app/Services/CreditService.php` dengan method:
      - `getStatus(User $user): array` — return `plan`, `resume_credits`, `active_subscription`
      - `activateSubscription(Subscription $subscription): void` — set status=active, user.plan=pro
      - `expireSubscriptions(): int` — query subscriptions expired, set status=expired, user.plan=free (tanpa reset credits)
    - _Requirements: 10.2, 10.3, 10.4, 10.5, 10.6, 10.8_

  - [x] 4.2 Buat `CreditController` dan route kredit
    - Buat `app/Http/Controllers/CreditController.php` dengan method `status()` (memanggil `CreditService::getStatus()` → 200) dan `createSubscription()` (validasi payload webhook → aktifkan subscription via `CreditService::activateSubscription()` → 201)
    - Daftarkan routes: `GET /api/credits` (middleware auth:sanctum), `POST /api/subscriptions` (middleware auth:sanctum)
    - _Requirements: 10.4, 10.8_

  - [x] 4.3 Setup cron job subscription expiry
    - Buat Artisan command `app/Console/Commands/ExpireSubscriptions.php`
    - Daftarkan di `routes/console.php` (atau `Kernel.php`): schedule harian jam 00:00 UTC
    - _Requirements: 10.5_

  - [x] 4.4 Tulis property test untuk credit system (Properties 5, 6, 7)
    - **Property 5:** Free user dengan credits=N, setelah buat satu resume, credits harus menjadi N-1
    - **Property 6:** Pro user dengan credits=N, setelah buat N resume baru, credits tetap N
    - **Property 7:** Untuk semua sequence operasi, resume_credits tidak pernah < 0
    - **Validates: Requirements 3.1, 3.2, 3.3, 10.2, 10.3**

  - [x] 4.5 Tulis property test untuk endpoint kredit (Property 20)
    - **Property 20:** Untuk semua user terautentikasi, respons `/api/credits` selalu mengandung field `plan`, `resume_credits`, `active_subscription`
    - **Validates: Requirements 10.8**


- [x] 5. Backend Resume CRUD
  - [x] 5.1 Buat `ResumeService`
    - Buat `app/Services/ResumeService.php` dengan method:
      - `create(User $user, array $data): Resume` — cek credits via `hasResumeCredits()`, buat resume, panggil `decrementResumeCredit()` jika free user, return resume
      - `delete(Resume $resume): void`
      - `validateDates(string $startDate, ?string $endDate): void` — throw ValidationException jika endDate < startDate
    - _Requirements: 3.1, 3.2, 3.3, 3.11_

  - [x] 5.2 Buat `ResumeController` dan routes resume
    - Buat `app/Http/Controllers/ResumeController.php` dengan:
      - `index()` — list resumes milik user terurut `updated_at` DESC, sertakan `plan` dan `resume_credits` → 200
      - `store()` — validasi input, panggil `ResumeService::create()` → 201 (atau 403 jika kredit habis)
      - `show(Resume $resume)` — load semua relasi, pastikan resume milik user → 200
      - `update(Resume $resume)` — update personal info/template → 200
      - `destroy(Resume $resume)` — hapus resume + cascade → 200
    - Daftarkan routes di `routes/api.php` dalam middleware group `auth:sanctum`
    - Tambahkan policy `ResumePolicy` untuk memastikan user hanya bisa akses resume miliknya
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4_

  - [x] 5.3 Tulis property test untuk dashboard dan delete cascade (Properties 3 & 4)
    - **Property 3:** Untuk user dengan N resume, respons dashboard selalu terurut descending by `updated_at` dan mengandung `plan`, `resume_credits`, `is_public`
    - **Property 4:** Setelah delete resume, semua relasi (education, experience, skills, projects, certificates) harus terhapus dari database
    - **Validates: Requirements 2.1, 2.2, 2.4, 2.5**


- [x] 6. Backend Resume Sections CRUD
  - [x] 6.1 Buat controllers dan routes untuk semua resume sections
    - Buat `app/Http/Controllers/EducationController.php` dengan `index()`, `store()`, `update()`, `destroy()` — validasi date range via `ResumeService::validateDates()`
    - Buat `app/Http/Controllers/ExperienceController.php` dengan `index()`, `store()`, `update()`, `destroy()` — validasi date range, handle `is_current=true` (end_date boleh null)
    - Buat `app/Http/Controllers/SkillController.php` dengan `index()`, `store()`, `update()`, `destroy()`
    - Buat `app/Http/Controllers/ProjectController.php` dengan `index()`, `store()`, `update()`, `destroy()`
    - Buat `app/Http/Controllers/CertificateController.php` dengan `index()`, `store()`, `update()`, `destroy()`
    - Daftarkan routes nested di bawah `/resumes/{resumeId}/` dalam middleware `auth:sanctum`
    - Tambahkan middleware untuk memastikan `resumeId` milik user yang sedang login
    - _Requirements: 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11_

  - [x] 6.2 Tulis property test untuk validasi date range (Property 9)
    - **Property 9:** Untuk semua pasangan `(start_date, end_date)` di mana `end_date < start_date`, request store education atau experience harus selalu mendapatkan respons 422
    - Generate random date pairs menggunakan faker
    - **Validates: Requirements 3.11**

  - [x] 6.3 Tulis property test untuk round-trip data sections (Property 10)
    - **Property 10:** Untuk semua entri section yang valid dengan nilai field acak, setelah store lalu GET, data yang dikembalikan harus identik dengan data yang disimpan
    - Test semua 5 section types (education, experience, skill, project, certificate)
    - **Validates: Requirements 3.5, 3.6, 3.7, 3.8, 3.9**

  - [x] 6.4 Tulis property test untuk update/delete sections tidak mengubah kredit (Property 8)
    - **Property 8:** Untuk semua user dengan credits=N, melakukan update atau delete pada entri sections tidak mengubah nilai `resume_credits`
    - **Validates: Requirements 3.10, 10.7**


- [x] 7. Backend Rate Limiting dan AI Job Infrastructure
  - [x] 7.1 Buat `RateLimitService`
    - Buat `app/Services/RateLimitService.php` dengan:
      - Konstanta `LIMITS['free']`: summary=10, experience_rewrite=10, ats_score=3, cover_letter=3
      - Method `checkOrFail(User $user, string $type): void` — jika user isPro() langsung return; ambil atau buat record `DailyAiUsage` untuk today UTC; jika count >= limit throw `RateLimitExceededException`; increment count
    - _Requirements: 4.7, 4.8, 5.7, 5.8, 6.4, 6.5, 7.5, 7.6_

  - [x] 7.2 Tulis property test untuk rate limiting (Properties 11 & 12)
    - **Property 11:** Untuk semua free user yang telah menggunakan summary atau experience_rewrite tepat 10 kali hari ini, request ke-11 harus mendapatkan 429
    - **Property 12:** Untuk semua free user yang telah menggunakan ats_score atau cover_letter tepat 3 kali hari ini, request ke-4 harus mendapatkan 429
    - **Validates: Requirements 4.7, 5.7, 6.4, 7.5**

  - [x] 7.3 Buat AI Provider layer (Gemini + OpenAI fallback)
    - Buat `app/Services/AI/GeminiProvider.php` dengan method `generate(string $prompt): string` — HTTP POST ke Gemini API, return teks hasil
    - Buat `app/Services/AI/OpenAIProvider.php` dengan method `generate(string $prompt): string` — HTTP POST ke OpenAI API, return teks hasil
    - Buat `app/Services/AI/AIProviderException.php`
    - _Requirements: 4.2, 4.3, 5.2, 5.3, 6.2, 6.6, 7.2, 7.3_

  - [x] 7.4 Buat `PromptBuilder` dan `AIService`
    - Buat `app/Services/PromptBuilder.php` dengan static methods:
      - `buildSummaryPrompt(Resume $resume): string` — sertakan personal info, education, experience, skills
      - `buildExperienceRewritePrompt(Experience $exp): string` — format STAR, minimal 3 bullet, action verb
      - `buildATSPrompt(Resume $resume): string` — return JSON `{score, recommendations}`
      - `buildCoverLetterPrompt(Resume $resume, string $company, string $position): string`
    - Buat `app/Services/AIService.php` dengan:
      - `dispatchJob(string $type, Resume $resume, array $extra = []): AiJob` — checkOrFail rate limit, buat AiJob record status=pending, dispatch ke Queue
      - `callWithFallback(string $prompt): string` — try Gemini, catch → try OpenAI, catch → throw
    - _Requirements: 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 7.1, 7.2, 7.3_


- [x] 8. Backend Queue Jobs dan AI Controller
  - [x] 8.1 Buat empat Queue Jobs untuk AI features
    - Buat `app/Jobs/GenerateAISummaryJob.php`: `$tries=1`, `$timeout=60`; di `handle()`: update status=processing, build summary prompt, callWithFallback, update status=completed+result atau status=failed+error_message
    - Buat `app/Jobs/RewriteExperienceJob.php`: sama dengan summary namun untuk experience rewrite; ambil Experience dari payload
    - Buat `app/Jobs/AnalyzeATSScoreJob.php`: update status=processing, build ATS prompt, callWithFallback, parse JSON result, update completed
    - Buat `app/Jobs/GenerateCoverLetterJob.php`: ambil `company_name` dan `position_name` dari payload, build cover letter prompt, callWithFallback, update completed
    - _Requirements: 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 7.1, 7.2, 7.3_

  - [x] 8.2 Buat `AIController` dengan semua AI endpoints dan polling
    - Buat `app/Http/Controllers/AIController.php` dengan methods:
      - `triggerSummary(Resume $resume)` → dispatch GenerateAISummaryJob via AIService, return job_id + status=pending (202)
      - `triggerExperienceRewrite(Resume $resume, Experience $experience)` → dispatch RewriteExperienceJob, return 202
      - `triggerATSScore(Resume $resume)` → dispatch AnalyzeATSScoreJob, return 202
      - `triggerCoverLetter(Resume $resume)` → validasi company_name + position_name tidak kosong (422 jika gagal), dispatch GenerateCoverLetterJob, return 202
      - `getJobStatus(AiJob $aiJob)` → cek ownership (403 jika bukan milik user), return job data → 200
      - `confirmSummary(Resume $resume)` → simpan teks ke `resume.summary` → 200
      - `confirmExperienceRewrite(Resume $resume, Experience $experience)` → simpan teks ke `experience.description` → 200
    - Daftarkan routes di `routes/api.php` dalam middleware `auth:sanctum`
    - _Requirements: 4.1, 4.4, 4.5, 4.6, 4.9, 5.1, 5.4, 5.5, 5.6, 6.1, 6.3, 7.1, 7.4, 11.1–11.5_

  - [x] 8.3 Tulis property test untuk AI job polling consistency (Properties 13 & 14)
    - **Property 13:** Untuk semua AI job valid milik user, respons polling selalu mengandung `job_id`, `type`, `status`; jika completed ada `result` tidak kosong; jika failed ada `error_message` tidak kosong
    - **Property 14:** Untuk semua pasangan user A dan B (A≠B), user A polling job milik B selalu mendapatkan 403
    - **Validates: Requirements 4.9, 11.1, 11.2, 11.4**

  - [x] 8.4 Tulis property test untuk konfirmasi AI result (Property 15)
    - **Property 15:** Untuk semua teks valid yang dikirim ke endpoint konfirmasi, setelah konfirmasi, GET resume harus mengembalikan field bersangkutan dengan nilai yang sama persis
    - Test untuk summary dan experience rewrite
    - **Validates: Requirements 4.5, 4.6, 5.5, 5.6**

- [x] 9. Checkpoint — Backend Core Features
  - Pastikan semua test backend lulus: `php artisan test`
  - Pastikan semua migrasi berjalan: `php artisan migrate:fresh --seed`
  - Verifikasi Queue worker berjalan: `php artisan queue:work`
  - Tanya user jika ada pertanyaan sebelum lanjut ke fitur PDF dan Share.


- [x] 10. Backend PDF Export
  - [x] 10.1 Setup Puppeteer dan PDF generator script
    - Install Node.js dependencies di `backend/`: `npm init -y` lalu `npm install puppeteer minimist`
    - Buat `backend/scripts/pdf-generator.js`: terima argumen `--input` (path HTML) dan `--output` (path PDF), launch Puppeteer dengan `--no-sandbox` flag (Railway environment), `page.goto(file://)`, `page.pdf({format: 'A4', printBackground: true, margin: {top/bottom: 20mm, left/right: 15mm}})`
    - _Requirements: 8.1, 8.6_

  - [x] 10.2 Buat HTML templates untuk PDF
    - Buat `backend/resources/pdf-templates/default.html` — ATS-friendly single column, font sans-serif, tanpa tabel kompleks atau gambar besar, gunakan Blade templating `{{ $resume->full_name }}` dll.
    - Buat `backend/resources/pdf-templates/modern.html` — dua kolom, warna aksen, lebih visual, gunakan Blade templating yang sama
    - _Requirements: 8.2_

  - [x] 10.3 Buat `PDFService` dan `PDFController`
    - Buat `app/Services/PDFService.php` dengan:
      - `getAvailableTemplates(User $user): Collection` — query `pdf_templates`; jika free user, filter `is_pro=false`
      - `resolveTemplate(string $slug, User $user): PdfTemplate` — cari by slug; jika tidak ditemukan gunakan `default`; jika `is_pro=true` dan user bukan pro, throw `ForbiddenException`
      - `generate(Resume $resume, PdfTemplate $template): string` — render Blade template dengan data resume (load semua relasi), tulis ke temp file, eksekusi `node scripts/pdf-generator.js`, baca output PDF, hapus temp files, return binary string
    - Buat `app/Http/Controllers/PDFController.php` dengan:
      - `templates()` — return daftar template sesuai plan user → 200
      - `export(Resume $resume)` — ambil query param `template`, resolve template via PDFService, generate PDF, return response dengan header `Content-Type: application/pdf` dan `Content-Disposition: attachment`
    - Daftarkan routes: `GET /api/pdf-templates` dan `GET /api/resumes/{resumeId}/export/pdf` dalam middleware `auth:sanctum`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [x] 10.4 Tulis property test untuk PDF template access control (Property 16)
    - **Property 16:** Untuk semua free user yang meminta ekspor PDF dengan template `is_pro=true`, respons harus selalu 403
    - **Validates: Requirements 8.3**


- [x] 11. Backend Share URL
  - [x] 11.1 Buat `ShareService` dan `ShareController`
    - Buat `app/Services/ShareService.php` dengan method `toggleVisibility(Resume $resume, bool $isPublic): array`:
      - Jika `$isPublic=true` dan `public_slug` belum ada: generate slug 8 karakter random, loop cek keunikan via `Resume::where('public_slug', $slug)->exists()`
      - Update `resume.is_public` dan `resume.public_slug` (slug dipertahankan saat nonaktif)
      - Return array berisi `is_public`, `public_slug`, `public_url` (atau null jika private)
    - Buat `app/Http/Controllers/ShareController.php` dengan:
      - `toggleVisibility(Resume $resume)` — validasi input `is_public` boolean, panggil ShareService, return 200
      - `show(string $publicSlug)` — query resume by `public_slug` WHERE `is_public=true` WITH semua relasi, return 200 atau 404
    - Daftarkan routes: `PATCH /api/resumes/{resumeId}/visibility` (middleware auth:sanctum) dan `GET /api/r/{publicSlug}` (tanpa auth)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [x] 11.2 Tulis property test untuk share URL (Properties 17, 18, 19)
    - **Property 17:** Untuk semua resume yang di-toggle `is_public=true`, `public_slug` yang dihasilkan harus unik di seluruh tabel `resumes`
    - **Property 18:** Untuk semua resume dengan `is_public=false`, akses ke `/api/r/{slug}` harus selalu 404
    - **Property 19:** Untuk semua resume yang pernah di-toggle public lalu private, nilai `public_slug` di database harus tidak berubah
    - **Validates: Requirements 9.4, 9.5, 9.6**


- [x] 12. Frontend Autentikasi
  - [x] 12.1 Buat `AuthContext` dan `useAuth` hook
    - Buat `frontend/src/contexts/AuthContext.tsx` dengan `AuthContext` (state: `user`, `isLoading`, `isAuthenticated`; actions: `login()`, `logout()`, `register()`)
    - Buat `frontend/src/hooks/useAuth.ts` sebagai consumer `AuthContext` — expose `user`, `isAuthenticated`, `login()`, `logout()`, `register()`
    - Buat `frontend/src/app/providers.tsx` sebagai `AuthProvider` yang membungkus seluruh app di `layout.tsx`
    - Tambahkan `middleware.ts` di root `frontend/src/` — redirect ke `/login` jika unauthenticated mengakses protected routes, redirect ke `/dashboard` jika authenticated mengakses `/login` atau `/register`
    - _Requirements: 1.1, 1.3, 1.5, 1.6_

  - [x] 12.2 Buat halaman Login dan Register
    - Buat `frontend/src/app/(auth)/login/page.tsx` — form dengan `email` dan `password` menggunakan React Hook Form + Zod schema `loginSchema`; on submit: panggil `useAuth().login()`, redirect ke `/dashboard` on success, tampilkan error message on failure
    - Buat `frontend/src/app/(auth)/register/page.tsx` — form dengan `name`, `email`, `password` menggunakan React Hook Form + Zod schema `registerSchema`; on submit: panggil `useAuth().register()`, redirect ke `/dashboard` on success
    - Buat layout `frontend/src/app/(auth)/layout.tsx` — centered layout tanpa sidebar
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.7_


- [x] 13. Frontend Dashboard
  - [x] 13.1 Buat `useResumes` hook dan `ResumeCard` component
    - Buat `frontend/src/hooks/useResumes.ts` — fetch `GET /api/resumes`, expose `resumes`, `user` (plan + credits), `isLoading`, `deleteResume(id)`, `createResume()`
    - Buat `frontend/src/components/resume/ResumeCard.tsx` — tampilkan `title`, `updated_at` (formatted), badge `is_public`, tombol Edit dan Delete; konfirmasi dialog sebelum delete
    - Buat `frontend/src/components/layout/CreditBadge.tsx` — tampilkan sisa kredit dan plan badge di header
    - _Requirements: 2.1, 2.2, 2.5_

  - [x] 13.2 Buat halaman Dashboard
    - Buat `frontend/src/app/dashboard/page.tsx` — fetch data via `useResumes()`, tampilkan grid `ResumeCard`, tombol "Buat Resume Baru"
    - Jika `plan=free` dan `resume_credits=0`: tombol disabled + tampilkan `Alert` bahwa kredit habis dan tawarkan upgrade ke Pro
    - Buat layout `frontend/src/app/dashboard/layout.tsx` — sidebar dengan navigasi (`Dashboard`, kredit badge)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_


- [x] 14. Frontend Resume Builder
  - [x] 14.1 Buat `usePolling` dan `useAIJob` hooks
    - Buat `frontend/src/hooks/usePolling.ts` — generic polling dengan `setInterval`; terima callback async dan interval (null = stop); cleanup via `clearInterval` di `useEffect` return
    - Buat `frontend/src/hooks/useAIJob.ts` — state: `jobId`, `status` (idle|pending|processing|completed|failed), `result`; `dispatch(endpoint, body)` untuk trigger job; gunakan `usePolling` tiap 2 detik saat status pending/processing; stop polling saat completed/failed
    - _Requirements: 4.1, 4.9, 5.1, 6.1, 7.1, 11.2_

  - [x] 14.2 Buat form components untuk semua resume sections
    - Buat `frontend/src/components/resume/PersonalInfoForm.tsx` — React Hook Form + `personalInfoSchema`; fields: `title`, `full_name`, `phone`, `address`; auto-save on blur atau tombol Save
    - Buat `frontend/src/components/resume/EducationForm.tsx` — CRUD list; modal tambah/edit dengan validasi date range; tampilkan error jika end_date < start_date
    - Buat `frontend/src/components/resume/ExperienceForm.tsx` — CRUD list; modal tambah/edit dengan validasi date range dan `is_current` toggle; tombol "AI Rewrite" per entry
    - Buat `frontend/src/components/resume/SkillsForm.tsx` — CRUD list dengan level selector (beginner/intermediate/advanced)
    - Buat `frontend/src/components/resume/ProjectsForm.tsx` — CRUD list dengan field URL dan tech_stack
    - Buat `frontend/src/components/resume/CertificatesForm.tsx` — CRUD list dengan `issue_date` dan `credential_url`
    - _Requirements: 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11_

  - [x] 14.3 Buat AI components
    - Buat `frontend/src/components/ai/AIJobStatus.tsx` — spinner saat pending/processing; tampilkan result text saat completed; tampilkan error saat failed
    - Buat `frontend/src/components/ai/AISummaryConfirm.tsx` — tampilkan draft summary dari AI Job result; editable textarea; tombol "Simpan" dan "Batal"; on confirm: POST ke `/ai/summary/confirm`
    - Buat `frontend/src/components/ai/ExperienceRewriteConfirm.tsx` — sama dengan summary namun untuk experience rewrite; on confirm: POST ke `/ai/rewrite/confirm`
    - Buat `frontend/src/components/ai/ATSScoreCard.tsx` — tampilkan circular progress atau angka skor 0–100; list rekomendasi perbaikan
    - Buat `frontend/src/components/ai/CoverLetterEditor.tsx` — input `company_name` dan `position_name`; trigger AI job; tampilkan hasil di textarea yang bisa diedit; tombol copy ke clipboard
    - _Requirements: 4.4, 4.5, 4.6, 4.9, 5.4, 5.5, 5.6, 6.3, 7.4_

  - [x] 14.4 Buat halaman Resume Builder dengan tab navigation
    - Buat `frontend/src/app/resumes/[id]/page.tsx` — tampilkan `ResumeFormTabs` dengan tabs: Personal, Education, Experience, Skills, Projects, Certificates, AI Summary, ATS Score, Cover Letter, Export
    - Buat `frontend/src/components/resume/ResumeFormTabs.tsx` — shadcn/ui Tabs component; setiap tab load section component yang sesuai
    - Buat `frontend/src/app/resumes/new/page.tsx` — POST `POST /api/resumes` untuk buat resume baru; redirect ke `/resumes/{id}` on success; tampilkan 403 error jika kredit habis
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 14.5 Buat halaman AI Summary, ATS Score, Cover Letter, dan Export
    - Buat `frontend/src/app/resumes/[id]/ai-summary/page.tsx` — tombol "Generate Summary" → dispatch AI job → polling → tampilkan `AISummaryConfirm`
    - Buat `frontend/src/app/resumes/[id]/ats-score/page.tsx` — tombol "Analisis ATS" → dispatch → polling → tampilkan `ATSScoreCard`; tampilkan warning rate limit jika 429
    - Buat `frontend/src/app/resumes/[id]/cover-letter/page.tsx` — input form company/position → dispatch → polling → tampilkan `CoverLetterEditor`
    - Buat `frontend/src/app/resumes/[id]/export/page.tsx` — fetch `GET /api/pdf-templates`, tampilkan `TemplateSelector`; tombol "Download PDF" → GET `/export/pdf?template={slug}` → trigger browser download
    - _Requirements: 4.1, 4.5, 4.6, 5.1, 5.5, 5.6, 6.1, 6.7, 7.1, 8.1, 8.2, 8.3_


- [x] 15. Frontend Share URL dan Public Resume Viewer
  - [x] 15.1 Buat Share URL toggle dan halaman public resume
    - Buat `frontend/src/components/resume/ShareToggle.tsx` — toggle switch `is_public`; PATCH ke `/api/resumes/{id}/visibility`; tampilkan public URL + tombol copy jika aktif
    - Buat `frontend/src/app/r/[slug]/page.tsx` — fetch `GET /api/r/{slug}` (no auth); render resume dalam read-only view; handle 404 gracefully
    - Tambahkan `ShareToggle` ke halaman Resume Builder (tab Export atau header)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_


- [x] 16. Frontend Landing Page
  - [x] 16.1 Buat landing page
    - Update `frontend/src/app/page.tsx` — ganti default Next.js content dengan landing page AlresumeBuilder: hero section (tagline + CTA "Mulai Gratis"), feature highlights (AI Summary, ATS Score, PDF Export), pricing section (Free vs Pro), footer
    - Redirect ke `/dashboard` jika user sudah terautentikasi
    - _Requirements: (UX — tidak ada requirement spesifik tapi ini entry point utama)_


- [x] 17. Integration Testing dan Finalisasi
  - [x] 17.1 End-to-end flow testing
    - Test full flow: Register → Dashboard → Buat Resume → Isi semua sections → Generate AI Summary → Confirm → ATS Score → Export PDF → Toggle Public
    - Verifikasi credit decrement dari 5 ke 4 setelah buat 1 resume
    - Verifikasi rate limit 429 setelah melampaui batas harian
    - Verifikasi public URL accessible tanpa auth
    - _Requirements: semua_

  - [x] 17.2 Setup environment variables production
    - Buat `.env.example` di `backend/` dengan semua variabel yang diperlukan (tanpa nilai sensitif)
    - Buat `.env.local.example` di `frontend/` dengan `NEXT_PUBLIC_API_URL` dan `NEXT_PUBLIC_APP_URL`
    - Update `README.md` utama dengan instruksi setup lengkap
    - _Requirements: (deployment)_

---

## Task Dependency Graph

```json
{
  "waves": [
    {
      "wave": 1,
      "tasks": ["1", "2"],
      "description": "Setup infrastruktur backend dan frontend — dapat dikerjakan paralel"
    },
    {
      "wave": 2,
      "tasks": ["3"],
      "description": "Backend autentikasi — depends on task 1"
    },
    {
      "wave": 3,
      "tasks": ["4"],
      "description": "Credit & Subscription service — depends on task 3"
    },
    {
      "wave": 4,
      "tasks": ["5", "12"],
      "description": "Resume CRUD backend + Frontend auth — dapat dikerjakan paralel (5 depends on 3,4; 12 depends on 2,3)"
    },
    {
      "wave": 5,
      "tasks": ["6", "13", "16"],
      "description": "Resume sections CRUD + Dashboard + Landing page — dapat dikerjakan paralel (6 depends on 5; 13 depends on 12,5; 16 depends on 12)"
    },
    {
      "wave": 6,
      "tasks": ["7"],
      "description": "Rate limiting dan AI infrastructure — depends on task 5"
    },
    {
      "wave": 7,
      "tasks": ["8"],
      "description": "Queue jobs dan AI controller — depends on task 7"
    },
    {
      "wave": 8,
      "tasks": ["10", "11"],
      "description": "PDF export dan Share URL backend — dapat dikerjakan paralel (10 depends on 5,8; 11 depends on 5)"
    },
    {
      "wave": 9,
      "tasks": ["9", "14"],
      "description": "Backend checkpoint + Resume builder frontend — dapat dikerjakan paralel (9 depends on 3-8; 14 depends on 12,5,6,7,8,10)"
    },
    {
      "wave": 10,
      "tasks": ["15"],
      "description": "Share URL frontend — depends on task 14, 11"
    },
    {
      "wave": 11,
      "tasks": ["17"],
      "description": "Integration testing dan finalisasi — depends on semua task di atas"
    }
  ]
}
```

---

## Notes

- Tasks bertanda `*` (misalnya `3.4*`) adalah **property-based tests** — bersifat opsional namun direkomendasikan untuk memvalidasi correctness properties yang terdefinisi di design.md.
- Backend dan frontend bisa dikerjakan secara paralel setelah task 1 (backend setup) dan task 2 (frontend setup) selesai.
- **Urutan minimum untuk demo MVP:** 1 → 3 → 4 → 5 → 6 → 12 → 13 → 14 → 17
- **Backend belum diinstall** — task 1.1 (`composer create-project`) wajib selesai sebelum task backend lainnya bisa dimulai.
- **shadcn/ui belum ditambahkan** — task 2.1 wajib selesai sebelum semua task frontend UI.
- Queue worker harus berjalan (`php artisan queue:work`) agar AI features berfungsi — di Railway ini di-setup sebagai separate worker service.
- Puppeteer memerlukan Chromium di Railway — gunakan flag `--no-sandbox` dan `--disable-setuid-sandbox` di `pdf-generator.js`.
- Semua UUID primary key sudah dikonfigurasi di model-model yang disiapkan di `backend/app/Models/`.
