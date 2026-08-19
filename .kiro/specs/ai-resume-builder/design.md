# Design Document — AI Resume Builder (AlresumeBuilder)

## Overview

AlresumeBuilder adalah aplikasi web SPA yang membantu fresh graduate membuat resume profesional dengan bantuan AI. Arsitektur memisahkan frontend (Next.js di Vercel) dari backend (Laravel di Railway), berkomunikasi via REST API JSON dengan autentikasi Sanctum SPA cookie-based.

---

## 1. Arsitektur Sistem

```
┌────────────────────────────────────────────────────────────────────┐
│                        VERCEL (Frontend)                           │
│  Next.js 16 App Router                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │  Pages   │  │Components│  │  Hooks   │  │  API Client      │  │
│  │/dashboard│  │ResumeForm│  │useResume │  │  (axios/fetch    │  │
│  │/resumes  │  │AIPanel   │  │useAIJob  │  │   + CSRF)        │  │
│  │/r/[slug] │  │PDFPreview│  │usePolling│  │                  │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘  │
│       └─────────────┴─────────────┴────────────────┘             │
│                          │ HTTPS REST                              │
└──────────────────────────┼─────────────────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────────────────┐
│                       RAILWAY (Backend)                             │
│  Laravel 12 + Sanctum + Queue Worker                               │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  HTTP Layer: routes/api.php → Controllers                    │  │
│  │  AuthController │ ResumeController │ AIController            │  │
│  │  PDFController  │ ShareController  │ CreditController        │  │
│  └──────────────────────────┬───────────────────────────────────┘  │
│                             │                                       │
│  ┌──────────────────────────▼───────────────────────────────────┐  │
│  │  Service Layer                                               │  │
│  │  AuthService │ ResumeService │ AIService │ PDFService        │  │
│  │  ATSService  │ CoverLetterService │ ShareService             │  │
│  │  CreditService                                               │  │
│  └──────────┬──────────────────┬────────────────────────────────┘  │
│             │                  │                                    │
│  ┌──────────▼──────┐  ┌────────▼────────────────────────────────┐  │
│  │  PostgreSQL DB  │  │  Laravel Queue (Redis / DB driver)      │  │
│  │  (Railway)      │  │  ┌──────────────────────────────────┐  │  │
│  │                 │  │  │  GenerateAISummaryJob             │  │  │
│  │  - users        │  │  │  RewriteExperienceJob             │  │  │
│  │  - resumes      │  │  │  AnalyzeATSScoreJob               │  │  │
│  │  - education    │  │  │  GenerateCoverLetterJob           │  │  │
│  │  - experience   │  │  └──────────┬───────────────────────┘  │  │
│  │  - skills       │  └────────────┼────────────────────────────┘  │
│  │  - projects     │               │                               │
│  │  - certificates │  ┌────────────▼────────────────────────────┐  │
│  │  - subscriptions│  │  AI Provider Layer                      │  │
│  │  - ai_jobs      │  │  GeminiProvider → OpenAIProvider        │  │
│  └─────────────────┘  │  (fallback kalau Gemini gagal)          │  │
│                        └────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  PDFService: Puppeteer (Node.js subprocess via exec())       │  │
│  │  Renders HTML template + resume data → PDF buffer → stream  │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Struktur Database

### 2.1 Tabel yang Sudah Ada (dari ERD v0.1)


```sql
-- Sudah ada di migration files
users (
  id             UUID PRIMARY KEY,
  name           VARCHAR,
  email          VARCHAR UNIQUE,
  password       VARCHAR,  -- bcrypt hashed
  plan           VARCHAR DEFAULT 'free',      -- 'free' | 'pro'
  resume_credits INTEGER  DEFAULT 5,
  created_at     TIMESTAMP,
  updated_at     TIMESTAMP
)

subscriptions (
  id          UUID PRIMARY KEY,
  user_id     UUID FK → users.id CASCADE DELETE,
  plan_name   VARCHAR,
  status      VARCHAR,    -- 'active' | 'expired' | 'cancelled'
  price       DECIMAL(10,2),
  payment_ref VARCHAR,
  started_at  TIMESTAMP,
  expires_at  TIMESTAMP,
  created_at  TIMESTAMP,
  updated_at  TIMESTAMP
)

resumes (
  id          UUID PRIMARY KEY,
  user_id     UUID FK → users.id CASCADE DELETE,
  title       VARCHAR,
  template    VARCHAR DEFAULT 'default',
  full_name   VARCHAR NULL,
  phone       VARCHAR NULL,
  address     VARCHAR NULL,
  summary     TEXT NULL,           -- AI-generated, confirmed by user
  is_public   BOOLEAN DEFAULT false,
  public_slug VARCHAR NULL UNIQUE,
  created_at  TIMESTAMP,
  updated_at  TIMESTAMP
)

education (
  id             UUID PRIMARY KEY,
  resume_id      UUID FK → resumes.id CASCADE DELETE,
  institution    VARCHAR,
  degree         VARCHAR,
  field_of_study VARCHAR,
  start_date     DATE,
  end_date       DATE NULL,
  gpa            VARCHAR NULL,
  created_at     TIMESTAMP,
  updated_at     TIMESTAMP
)

experience (
  id          UUID PRIMARY KEY,
  resume_id   UUID FK → resumes.id CASCADE DELETE,
  company     VARCHAR,
  position    VARCHAR,
  start_date  DATE,
  end_date    DATE NULL,
  is_current  BOOLEAN DEFAULT false,
  description TEXT NULL,    -- AI-assisted
  created_at  TIMESTAMP,
  updated_at  TIMESTAMP
)

skills (
  id        UUID PRIMARY KEY,
  resume_id UUID FK → resumes.id CASCADE DELETE,
  name      VARCHAR,
  level     VARCHAR,   -- 'beginner' | 'intermediate' | 'advanced'
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

projects (
  id         UUID PRIMARY KEY,
  resume_id  UUID FK → resumes.id CASCADE DELETE,
  name       VARCHAR,
  description TEXT NULL,
  url        VARCHAR NULL,
  tech_stack VARCHAR NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

certificates (
  id             UUID PRIMARY KEY,
  resume_id      UUID FK → resumes.id CASCADE DELETE,
  name           VARCHAR,
  issuer         VARCHAR,
  issue_date     DATE,
  credential_url VARCHAR NULL,
  created_at     TIMESTAMP,
  updated_at     TIMESTAMP
)
```

### 2.2 Tabel Baru: `ai_jobs`

```sql
-- Migration: 2024_01_01_000009_create_ai_jobs_table.php
ai_jobs (
  id            UUID PRIMARY KEY,
  user_id       UUID FK → users.id CASCADE DELETE,
  resume_id     UUID FK → resumes.id CASCADE DELETE,
  type          VARCHAR,       -- 'summary' | 'experience_rewrite' | 'ats_score' | 'cover_letter'
  status        VARCHAR DEFAULT 'pending',  -- 'pending' | 'processing' | 'completed' | 'failed'
  payload       JSONB NULL,    -- input data yang dikirim ke AI (untuk retry)
  result        TEXT NULL,     -- output dari AI (plaintext atau JSON string)
  error_message TEXT NULL,
  created_at    TIMESTAMP,
  updated_at    TIMESTAMP
)
```

### 2.3 Tabel Baru: `pdf_templates`

```sql
-- Migration: 2024_01_01_000010_create_pdf_templates_table.php
pdf_templates (
  id          UUID PRIMARY KEY,
  name        VARCHAR,         -- 'ATS Friendly' | 'Modern Visual'
  slug        VARCHAR UNIQUE,  -- 'default' | 'modern'
  description VARCHAR NULL,
  is_pro      BOOLEAN DEFAULT false,
  html_path   VARCHAR,         -- path ke file template di storage
  thumbnail   VARCHAR NULL,    -- URL preview thumbnail
  created_at  TIMESTAMP,
  updated_at  TIMESTAMP
)
```

### 2.4 Tabel Baru: `daily_ai_usage`

```sql
-- Migration: 2024_01_01_000011_create_daily_ai_usage_table.php
daily_ai_usage (
  id         UUID PRIMARY KEY,
  user_id    UUID FK → users.id CASCADE DELETE,
  type       VARCHAR,          -- 'summary' | 'experience_rewrite' | 'ats_score' | 'cover_letter'
  usage_date DATE,             -- tanggal UTC
  count      INTEGER DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(user_id, type, usage_date)
)
```

---

## 3. Auth Flow — Sanctum SPA Cookie-Based


```
Frontend (Next.js)              Backend (Laravel Sanctum)
      │                                   │
      │── GET /sanctum/csrf-cookie ───────►│  Set XSRF-TOKEN cookie
      │◄──────────────────────────────────│
      │                                   │
      │── POST /api/auth/register ────────►│  Create user, issue token
      │   Body: {name, email, password}   │  Set laravel_session cookie
      │◄── 201 {user, token} ─────────────│
      │                                   │
      │  [Subsequent requests]            │
      │── GET /api/resumes ───────────────►│  Reads laravel_session
      │   Headers: X-XSRF-TOKEN: <token>  │  (or Bearer token for API)
      │◄── 200 {resumes[]} ───────────────│
      │                                   │
      │── POST /api/auth/logout ──────────►│  Revoke token + clear session
      │◄── 200 ───────────────────────────│
```

**Implementasi di Laravel:**

```php
// config/cors.php
'allowed_origins' => [env('FRONTEND_URL', 'https://alresumebuilder.vercel.app')],
'supports_credentials' => true,

// routes/api.php
Route::post('/sanctum/csrf-cookie', ...) // dari vendor Sanctum
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login']);
    Route::post('/logout',   [AuthController::class, 'logout'])->middleware('auth:sanctum');
});
```

**Implementasi di Next.js:**

```typescript
// lib/api-client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,  // kirim cookie ke backend
  headers: { 'Accept': 'application/json' },
});

// Intercept untuk attach XSRF token
apiClient.interceptors.request.use(async (config) => {
  const xsrfToken = getCookie('XSRF-TOKEN');
  if (!xsrfToken) {
    await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/sanctum/csrf-cookie`,
      { withCredentials: true });
  }
  return config;
});
```

---

## 4. API Design

Semua endpoint menggunakan prefix `/api`. Format respons mengikuti konvensi JSON API dengan envelope `data`, `message`, dan `errors`.

### 4.1 Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Daftar akun baru |
| POST | `/api/auth/login` | — | Login |
| POST | `/api/auth/logout` | ✓ | Logout + revoke token |
| GET | `/api/auth/me` | ✓ | Data user saat ini |

**POST /api/auth/register**
```json
// Request
{ "name": "Budi Santoso", "email": "budi@email.com", "password": "secret123" }

// Response 201
{
  "data": {
    "user": { "id": "uuid", "name": "Budi Santoso", "email": "...",
              "plan": "free", "resume_credits": 5 },
    "token": "1|abc123..."
  }
}
```

### 4.2 Resumes (CRUD)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/resumes` | ✓ | List resume milik user (+ plan info) |
| POST | `/api/resumes` | ✓ | Buat resume baru (cek & potong kredit) |
| GET | `/api/resumes/{id}` | ✓ | Detail resume lengkap |
| PATCH | `/api/resumes/{id}` | ✓ | Update personal info / template |
| DELETE | `/api/resumes/{id}` | ✓ | Hapus resume + cascade |

**GET /api/resumes — Response 200**
```json
{
  "data": {
    "resumes": [
      { "id": "uuid", "title": "My Resume", "template": "default",
        "is_public": false, "updated_at": "2025-01-01T00:00:00Z" }
    ],
    "user": { "plan": "free", "resume_credits": 3 }
  }
}
```


### 4.3 Resume Sections (Education, Experience, Skills, Projects, Certificates)

Pola URL seragam untuk semua section:

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/resumes/{resumeId}/education` | ✓ | List education entries |
| POST | `/api/resumes/{resumeId}/education` | ✓ | Tambah education |
| PATCH | `/api/resumes/{resumeId}/education/{id}` | ✓ | Update education |
| DELETE | `/api/resumes/{resumeId}/education/{id}` | ✓ | Hapus education |

*Endpoint serupa untuk: `/experience`, `/skills`, `/projects`, `/certificates`*

**POST /api/resumes/{resumeId}/experience — Request**
```json
{
  "company": "PT. Contoh Maju",
  "position": "Software Engineer Intern",
  "start_date": "2024-01-01",
  "end_date": null,
  "is_current": true,
  "description": "Mengerjakan fitur backend..."
}
```

### 4.4 AI Features

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/resumes/{resumeId}/ai/summary` | ✓ | Trigger AI Summary |
| POST | `/api/resumes/{resumeId}/experience/{expId}/ai/rewrite` | ✓ | Trigger Experience Rewrite |
| POST | `/api/resumes/{resumeId}/ai/ats-score` | ✓ | Trigger ATS Score |
| POST | `/api/resumes/{resumeId}/ai/cover-letter` | ✓ | Trigger Cover Letter |
| GET | `/api/ai-jobs/{jobId}/status` | ✓ | Polling status AI Job |
| POST | `/api/resumes/{resumeId}/ai/summary/confirm` | ✓ | Konfirmasi & simpan summary |
| POST | `/api/resumes/{resumeId}/experience/{expId}/ai/rewrite/confirm` | ✓ | Konfirmasi & simpan rewrite |

**POST /api/resumes/{resumeId}/ai/summary — Response 202**
```json
{ "data": { "job_id": "uuid", "status": "pending" } }
```

**GET /api/ai-jobs/{jobId}/status — Response 200**
```json
{
  "data": {
    "job_id": "uuid",
    "type": "summary",
    "status": "completed",
    "result": "Seorang fresh graduate berpengalaman di...",
    "error_message": null,
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:03Z"
  }
}
```

**POST /api/resumes/{resumeId}/ai/cover-letter — Request**
```json
{ "company_name": "PT. Tokopedia", "position_name": "Backend Engineer" }
```

### 4.5 PDF Export

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/pdf-templates` | ✓ | List template yang tersedia |
| GET | `/api/resumes/{resumeId}/export/pdf` | ✓ | Download PDF |

**GET /api/resumes/{resumeId}/export/pdf?template=default**
```
Response 200
Content-Type: application/pdf
Content-Disposition: attachment; filename="resume-{slug}.pdf"
[binary PDF data]
```

### 4.6 Share / Public URL

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| PATCH | `/api/resumes/{resumeId}/visibility` | ✓ | Toggle is_public, dapatkan public URL |
| GET | `/api/r/{publicSlug}` | — | Akses resume publik (no auth) |

**PATCH /api/resumes/{resumeId}/visibility — Request & Response**
```json
// Request
{ "is_public": true }

// Response 200
{
  "data": {
    "is_public": true,
    "public_slug": "abc123xyz",
    "public_url": "https://alresumebuilder.com/r/abc123xyz"
  }
}
```

### 4.7 Credits & Subscription

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/credits` | ✓ | Status kredit dan langganan |
| POST | `/api/subscriptions` | ✓ | Buat/update subscription (webhook dari payment) |

**GET /api/credits — Response 200**
```json
{
  "data": {
    "plan": "free",
    "resume_credits": 3,
    "active_subscription": null
  }
}
```

---

## 5. Backend Service Layer

### 5.1 ResumeService

```php
// app/Services/ResumeService.php
class ResumeService
{
    public function create(User $user, array $data): Resume
    {
        // 1. Cek kredit via CreditService
        if (!$user->hasResumeCredits()) {
            throw new InsufficientCreditsException('Kredit resume habis. Upgrade ke Pro.');
        }

        // 2. Buat resume
        $resume = Resume::create([...$data, 'user_id' => $user->id]);

        // 3. Potong kredit jika free user
        $user->decrementResumeCredit();

        // 4. Return dengan warning jika kredit = 0 setelah decrement
        return $resume;
    }

    public function delete(Resume $resume): void
    {
        // Cascade sudah dihandle DB-level, tapi kita eksplisit untuk clarity
        $resume->delete(); // cascade di migration
    }

    public function validateDates(string $startDate, ?string $endDate): void
    {
        if ($endDate && Carbon::parse($endDate)->lt(Carbon::parse($startDate))) {
            throw new ValidationException('end_date tidak boleh lebih awal dari start_date.');
        }
    }
}
```

### 5.2 AIService

```php
// app/Services/AIService.php
class AIService
{
    private RateLimitService $rateLimit;
    private GeminiProvider   $gemini;
    private OpenAIProvider   $openai;

    public function dispatchJob(string $type, Resume $resume, array $extra = []): AiJob
    {
        // 1. Cek rate limit (hanya untuk free user)
        $this->rateLimit->checkOrFail(auth()->user(), $type);

        // 2. Buat ai_job record
        $job = AiJob::create([
            'user_id'   => $resume->user_id,
            'resume_id' => $resume->id,
            'type'      => $type,
            'status'    => 'pending',
            'payload'   => [...$extra],
        ]);

        // 3. Dispatch ke Queue
        match ($type) {
            'summary'             => GenerateAISummaryJob::dispatch($job),
            'experience_rewrite'  => RewriteExperienceJob::dispatch($job),
            'ats_score'           => AnalyzeATSScoreJob::dispatch($job),
            'cover_letter'        => GenerateCoverLetterJob::dispatch($job),
        };

        return $job;
    }

    public function callWithFallback(string $prompt): string
    {
        try {
            return $this->gemini->generate($prompt);
        } catch (AIProviderException $e) {
            return $this->openai->generate($prompt);
        }
    }
}
```

### 5.3 CreditService

```php
// app/Services/CreditService.php
class CreditService
{
    public function getStatus(User $user): array
    {
        $sub = $user->subscriptions()
            ->where('status', 'active')
            ->orderBy('expires_at', 'desc')
            ->first();

        return [
            'plan'                 => $user->plan,
            'resume_credits'       => $user->resume_credits,
            'active_subscription'  => $sub ? [
                'plan_name'  => $sub->plan_name,
                'expires_at' => $sub->expires_at,
            ] : null,
        ];
    }

    public function activateSubscription(Subscription $subscription): void
    {
        $subscription->update(['status' => 'active']);
        $subscription->user->update(['plan' => 'pro']);
    }

    // Dipanggil dari cron job harian
    public function expireSubscriptions(): int
    {
        $expired = Subscription::where('status', 'active')
            ->where('expires_at', '<', now())
            ->with('user')
            ->get();

        foreach ($expired as $sub) {
            $sub->update(['status' => 'expired']);
            $sub->user->update(['plan' => 'free']);
            // Tidak reset resume_credits (sesuai req 10.6)
        }

        return $expired->count();
    }
}
```

### 5.4 RateLimitService

```php
// app/Services/RateLimitService.php
class RateLimitService
{
    const LIMITS = [
        'free' => [
            'summary'            => 10,
            'experience_rewrite' => 10,
            'ats_score'          => 3,
            'cover_letter'       => 3,
        ],
        'pro' => [],  // tidak ada batasan
    ];

    public function checkOrFail(User $user, string $type): void
    {
        if ($user->isPro()) return;

        $limit = self::LIMITS['free'][$type] ?? 0;
        $today = now()->toDateString(); // UTC

        $usage = DailyAiUsage::firstOrCreate(
            ['user_id' => $user->id, 'type' => $type, 'usage_date' => $today],
            ['count' => 0]
        );

        if ($usage->count >= $limit) {
            throw new RateLimitExceededException("Batas penggunaan harian tercapai.");
        }

        $usage->increment('count');
    }
}
```


---

## 6. AI Job System — Flow Detail

```
User Request (POST /api/resumes/{id}/ai/summary)
         │
         ▼
   AIController::triggerSummary()
         │
         ▼
   RateLimitService::checkOrFail(user, 'summary')
   ── free user: cek daily_ai_usage, increment counter
   ── limit exceeded → throw RateLimitExceededException → 429
         │
         ▼
   AiJob::create(status='pending') → return job_id (202)
         │
         ▼
   GenerateAISummaryJob::dispatch($job)
         │
         ▼ [Laravel Queue Worker — background]
         │
   GenerateAISummaryJob::handle()
         │
   AiJob::update(status='processing')
         │
         ▼
   Bangun prompt dari Resume data
   (Personal Info + Education + Experience + Skills + Projects)
         │
         ▼
   AIService::callWithFallback($prompt)
   ┌────────────────────────────────────┐
   │ try GeminiProvider::generate()     │
   │  success → return result           │
   │  fail (exception) →                │
   │    try OpenAIProvider::generate()  │
   │    fail → throw AIProviderException│
   └────────────────────────────────────┘
         │
    success ──────────────────────────────────────► AiJob::update(
         │                                            status='completed',
         │                                            result=$text
         │                                          )
    fail ────────────────────────────────────────► AiJob::update(
                                                     status='failed',
                                                     error_message=$msg
                                                   )

Frontend Polling (GET /api/ai-jobs/{jobId}/status) — setiap 2 detik
         │
         ▼
   Cek status dari DB
   ── pending/processing → return current status
   ── completed → return status + result
   ── failed → return status + error_message

User Konfirmasi (POST /api/resumes/{id}/ai/summary/confirm)
   Body: { "text": "Teks yang sudah dikonfirmasi/diedit user" }
         │
         ▼
   Resume::update(['summary' => $text]) → 200
```

### 6.1 Queue Jobs

```php
// app/Jobs/GenerateAISummaryJob.php
class GenerateAISummaryJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;     // tidak retry otomatis, fallback dihandle di AIService
    public int $timeout = 60;  // 60 detik timeout

    public function __construct(private AiJob $aiJob) {}

    public function handle(AIService $aiService): void
    {
        $this->aiJob->update(['status' => 'processing']);

        try {
            $resume = $this->aiJob->resume->load(
                'education', 'experience', 'skills', 'projects'
            );
            $prompt  = PromptBuilder::buildSummaryPrompt($resume);
            $result  = $aiService->callWithFallback($prompt);

            $this->aiJob->update(['status' => 'completed', 'result' => $result]);
        } catch (\Exception $e) {
            $this->aiJob->update([
                'status'        => 'failed',
                'error_message' => $e->getMessage(),
            ]);
        }
    }
}
```

### 6.2 Prompt Builder

```php
// app/Services/PromptBuilder.php
class PromptBuilder
{
    public static function buildSummaryPrompt(Resume $resume): string
    {
        return <<<PROMPT
        Buatkan ringkasan profil profesional 2-3 kalimat dalam format paragraf
        berdasarkan data berikut:

        Nama: {$resume->full_name}
        Pendidikan: {$resume->education->map(fn($e) => "{$e->degree} di {$e->institution}")->join(', ')}
        Pengalaman: {$resume->experience->map(fn($e) => "{$e->position} di {$e->company}")->join(', ')}
        Skills: {$resume->skills->pluck('name')->join(', ')}

        Tulis dalam bahasa Indonesia yang profesional dan padat.
        Jangan tambahkan label atau tanda lain, langsung tulis paragrafnya.
        PROMPT;
    }

    public static function buildATSPrompt(Resume $resume): string
    {
        // Serialize seluruh resume data ke teks untuk analisis ATS
        $content = json_encode($resume->toArray(), JSON_PRETTY_PRINT);
        return <<<PROMPT
        Analisis resume berikut dan berikan:
        1. Skor ATS (0-100) berdasarkan kelengkapan, format, dan relevansi kata kunci
        2. Minimal 3 rekomendasi spesifik untuk meningkatkan skor

        Format respons JSON:
        {"score": <integer>, "recommendations": ["...", "...", "..."]}

        Data resume:
        {$content}
        PROMPT;
    }
}
```

---

## 7. PDF Export — Puppeteer Flow

```
GET /api/resumes/{resumeId}/export/pdf?template=default
         │
         ▼
   PDFController::export()
   ── Validasi template: ambil dari pdf_templates via PDFService
   ── Free user + is_pro template → 403
   ── Template tidak ditemukan → gunakan 'default'
         │
         ▼
   PDFService::generate(Resume $resume, PdfTemplate $template): string
         │
   1. Load HTML template dari storage (resources/pdf-templates/{slug}.html)
   2. Render template: Blade::render($htmlTemplate, ['resume' => $resume->load(all relations)])
   3. Tulis HTML ke temp file (storage/app/tmp/resume-{uuid}.html)
         │
         ▼
   4. Jalankan Puppeteer via Node.js subprocess:
      node scripts/pdf-generator.js \
        --input=/path/to/temp.html \
        --output=/path/to/output.pdf \
        --format=A4
         │
         ▼
   5. Baca PDF buffer dari output file
   6. Hapus temp files
   7. Return binary stream
         │
         ▼
   Response 200
   Content-Type: application/pdf
   Content-Disposition: attachment; filename="resume-{publicSlug|id}.pdf"
```

### 7.1 PDF Generator Script (Node.js)

```javascript
// backend/scripts/pdf-generator.js
const puppeteer = require('puppeteer');
const args = require('minimist')(process.argv.slice(2));

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],  // Railway environment
  });
  const page = await browser.newPage();

  await page.goto(`file://${args.input}`, { waitUntil: 'networkidle0' });

  await page.pdf({
    path: args.output,
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
  });

  await browser.close();
})();
```

### 7.2 Template System

```php
// app/Services/PDFService.php
class PDFService
{
    public function getAvailableTemplates(User $user): Collection
    {
        $query = PdfTemplate::query();

        if (!$user->isPro()) {
            $query->where('is_pro', false);
        }

        return $query->orderBy('name')->get();
    }

    public function resolveTemplate(string $slug, User $user): PdfTemplate
    {
        $template = PdfTemplate::where('slug', $slug)->first();

        // Fallback ke default jika tidak ditemukan
        if (!$template) {
            return PdfTemplate::where('slug', 'default')->firstOrFail();
        }

        // Free user tidak bisa pakai template pro
        if ($template->is_pro && !$user->isPro()) {
            throw new ForbiddenException('Template ini tersedia untuk akun Pro.');
        }

        return $template;
    }
}
```

---

## 8. Share URL — ShareService

```php
// app/Services/ShareService.php
class ShareService
{
    public function toggleVisibility(Resume $resume, bool $isPublic): array
    {
        if ($isPublic && !$resume->public_slug) {
            // Generate slug unik (8 karakter alphanumeric)
            do {
                $slug = Str::random(8);
            } while (Resume::where('public_slug', $slug)->exists());

            $resume->update(['is_public' => true, 'public_slug' => $slug]);
        } else {
            // Nonaktifkan tapi pertahankan slug
            $resume->update(['is_public' => $isPublic]);
        }

        return [
            'is_public'  => $resume->is_public,
            'public_slug' => $resume->public_slug,
            'public_url' => $resume->is_public
                ? config('app.frontend_url') . '/r/' . $resume->public_slug
                : null,
        ];
    }
}
```

**Public Resume Route (tanpa auth):**
```php
// routes/api.php
Route::get('/r/{publicSlug}', [ShareController::class, 'show']);

// ShareController::show()
public function show(string $publicSlug): JsonResponse
{
    $resume = Resume::where('public_slug', $publicSlug)
        ->where('is_public', true)
        ->with(['education', 'experience', 'skills', 'projects', 'certificates'])
        ->firstOrFail(); // throws 404 jika tidak ditemukan atau is_public=false

    return response()->json(['data' => new PublicResumeResource($resume)]);
}
```


---

## 9. Frontend Structure — Next.js 16 App Router

```
frontend/src/
├── app/
│   ├── layout.tsx                  # Root layout (global font, providers)
│   ├── page.tsx                    # Landing page (redirect ke dashboard jika authed)
│   │
│   ├── (auth)/                     # Route group — no sidebar
│   │   ├── login/
│   │   │   └── page.tsx            # Halaman Login
│   │   └── register/
│   │       └── page.tsx            # Halaman Register
│   │
│   ├── dashboard/
│   │   ├── layout.tsx              # Layout dengan sidebar
│   │   └── page.tsx                # Dashboard — list resume + credit info
│   │
│   ├── resumes/
│   │   ├── new/
│   │   │   └── page.tsx            # Buat resume baru (trigger credit check)
│   │   └── [id]/
│   │       ├── page.tsx            # Resume builder (tabs: Personal, Edu, Exp, Skills, PDF)
│   │       ├── personal/
│   │       │   └── page.tsx        # Tab Personal Info
│   │       ├── education/
│   │       │   └── page.tsx        # Tab Education
│   │       ├── experience/
│   │       │   └── page.tsx        # Tab Experience + AI Rewrite panel
│   │       ├── skills/
│   │       │   └── page.tsx        # Tab Skills
│   │       ├── projects/
│   │       │   └── page.tsx        # Tab Projects
│   │       ├── certificates/
│   │       │   └── page.tsx        # Tab Certificates
│   │       ├── ai-summary/
│   │       │   └── page.tsx        # Tab AI Summary + konfirmasi
│   │       ├── ats-score/
│   │       │   └── page.tsx        # Tab ATS Score
│   │       ├── cover-letter/
│   │       │   └── page.tsx        # Tab Cover Letter
│   │       └── export/
│   │           └── page.tsx        # Tab Export PDF (pilih template)
│   │
│   └── r/
│       └── [slug]/
│           └── page.tsx            # Public resume viewer (no auth)
│
├── components/
│   ├── ui/                         # shadcn/ui components (setelah install)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── dialog.tsx
│   │   ├── progress.tsx
│   │   └── ...
│   │
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── CreditBadge.tsx         # Tampilkan sisa kredit di header
│   │
│   ├── resume/
│   │   ├── ResumeCard.tsx          # Card di dashboard
│   │   ├── ResumeFormTabs.tsx      # Tab navigation di resume builder
│   │   ├── PersonalInfoForm.tsx    # React Hook Form + Zod
│   │   ├── EducationForm.tsx
│   │   ├── ExperienceForm.tsx
│   │   ├── SkillsForm.tsx
│   │   ├── ProjectsForm.tsx
│   │   └── CertificatesForm.tsx
│   │
│   ├── ai/
│   │   ├── AIPanel.tsx             # Wrapper AI feature panel
│   │   ├── AIJobStatus.tsx         # Polling indicator (spinner → result)
│   │   ├── AISummaryConfirm.tsx    # Preview + edit + confirm/reject
│   │   ├── ExperienceRewriteConfirm.tsx
│   │   ├── ATSScoreCard.tsx        # Tampilkan score + rekomendasi
│   │   └── CoverLetterEditor.tsx   # Edit + copy hasil cover letter
│   │
│   └── pdf/
│       ├── TemplateSelector.tsx    # Grid pilihan template
│       └── PDFExportButton.tsx     # Trigger download
│
├── hooks/
│   ├── useAuth.ts                  # Login, logout, session state
│   ├── useResumes.ts               # CRUD resumes
│   ├── useAIJob.ts                 # Dispatch job + polling
│   ├── useCredits.ts               # Fetch credit status
│   └── usePolling.ts               # Generic polling utility (interval + cleanup)
│
├── lib/
│   ├── api-client.ts               # Axios instance + CSRF interceptor
│   ├── validations/
│   │   ├── auth.schema.ts          # Zod schemas untuk form auth
│   │   ├── resume.schema.ts        # Zod schemas untuk resume forms
│   │   └── ai.schema.ts            # Zod schemas untuk AI inputs
│   └── utils.ts                    # cn(), formatDate(), truncate(), etc.
│
└── types/
    ├── api.ts                      # Response types dari backend
    ├── resume.ts                   # Resume, Education, Experience, dll.
    └── ai-job.ts                   # AiJob, AiJobStatus types
```

### 9.1 State Management

State di-manage secara **lokal** menggunakan React hooks — tidak menggunakan Zustand/Redux karena scope state cukup terbatas:

- **Auth state**: `useAuth()` hook dengan React Context (`AuthContext`) — menyimpan `user` object dan expose `login()`, `logout()`, `isAuthenticated`
- **Resume state**: Component-level state dengan `useResumes()` dan `useResume(id)` hooks
- **AI Job state**: `useAIJob()` hook mengelola dispatch + polling lifecycle
- **Form state**: React Hook Form (sudah ada di package.json) + Zod validation

```typescript
// hooks/useAIJob.ts
export function useAIJob() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'pending' | 'processing' | 'completed' | 'failed'>('idle');
  const [result, setResult] = useState<string | null>(null);

  const dispatch = async (endpoint: string, body?: object) => {
    const res = await apiClient.post(endpoint, body);
    setJobId(res.data.data.job_id);
    setStatus('pending');
  };

  // Polling setiap 2 detik selama status pending/processing
  usePolling(
    async () => {
      if (!jobId || status === 'completed' || status === 'failed') return;
      const res = await apiClient.get(`/ai-jobs/${jobId}/status`);
      setStatus(res.data.data.status);
      if (res.data.data.result) setResult(res.data.data.result);
    },
    status === 'pending' || status === 'processing' ? 2000 : null
  );

  return { dispatch, status, result, jobId };
}
```

### 9.2 Zod Validation Schemas

```typescript
// lib/validations/resume.schema.ts
import { z } from 'zod';

export const educationSchema = z.object({
  institution:    z.string().min(1, 'Institusi wajib diisi'),
  degree:         z.string().min(1, 'Gelar wajib diisi'),
  field_of_study: z.string().min(1, 'Bidang studi wajib diisi'),
  start_date:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  gpa:            z.string().nullable().optional(),
}).refine(
  (data) => !data.end_date || data.end_date >= data.start_date,
  { message: 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai', path: ['end_date'] }
);
```

---

## 10. Error Handling

### Backend

```php
// app/Exceptions/Handler.php — render exceptions ke JSON
protected function handleApiExceptions(Request $request, Throwable $e): ?Response
{
    return match(true) {
        $e instanceof InsufficientCreditsException
            => response()->json(['message' => $e->getMessage()], 403),
        $e instanceof RateLimitExceededException
            => response()->json(['message' => $e->getMessage()], 429),
        $e instanceof ModelNotFoundException
            => response()->json(['message' => 'Tidak ditemukan.'], 404),
        $e instanceof AuthorizationException
            => response()->json(['message' => 'Akses ditolak.'], 403),
        $e instanceof ValidationException
            => response()->json(['errors' => $e->errors()], 422),
        default => null,
    };
}
```

### Frontend

```typescript
// lib/api-client.ts — global error interceptor
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect ke login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## 11. Cron Job — Subscription Expiry

```php
// routes/console.php
Schedule::call(function () {
    app(CreditService::class)->expireSubscriptions();
})->dailyAt('00:00')->timezone('UTC');
```

Atau via `app/Console/Kernel.php` jika menggunakan Laravel 11 legacy console:
```php
$schedule->command('subscriptions:expire')->dailyAt('00:00');
```

---

## 12. Correctness Properties

*Sebuah property adalah karakteristik atau perilaku yang harus berlaku di semua eksekusi sistem yang valid — pernyataan formal tentang apa yang seharusnya dilakukan sistem. Properties menjembatani antara spesifikasi yang dapat dibaca manusia dan jaminan kebenaran yang dapat diverifikasi secara otomatis.*


### Property 1: Registrasi selalu membuat akun dengan kredit dan plan default

*Untuk semua* kombinasi `name`, `email` unik, dan `password` yang valid (panjang ≥ 8 karakter), permintaan registrasi harus selalu menghasilkan akun baru dengan `plan = 'free'` dan `resume_credits = 5`.

**Validates: Requirements 1.1, 1.7, 10.1**

---

### Property 2: Protected routes selalu menolak request tanpa autentikasi

*Untuk semua* endpoint yang dilindungi (`/api/resumes`, `/api/ai-jobs/*`, `/api/credits`, dll.), setiap HTTP request tanpa token Sanctum yang valid harus selalu mendapatkan respons 401.

**Validates: Requirements 1.6**

---

### Property 3: Dashboard selalu mengembalikan resume terurut descending

*Untuk semua* user yang memiliki N resume (N ≥ 0), respons endpoint dashboard harus selalu mengembalikan array resume yang terurut secara descending berdasarkan `updated_at`, dan menyertakan field `plan`, `resume_credits`, serta `is_public` pada setiap resume.

**Validates: Requirements 2.1, 2.2, 2.5**

---

### Property 4: Menghapus resume menghapus semua relasinya

*Untuk semua* resume yang memiliki data relasi (education, experience, skills, projects, certificates), setelah operasi delete berhasil, tidak boleh ada satu pun record relasi yang merujuk pada resume tersebut yang masih tersisa di database.

**Validates: Requirements 2.4**

---

### Property 5: Membuat resume mengurangi kredit free user tepat 1

*Untuk semua* free user dengan `resume_credits = N` (N > 0), setelah berhasil membuat satu resume baru, nilai `resume_credits` user harus menjadi tepat `N - 1`.

**Validates: Requirements 3.1, 10.2**

---

### Property 6: Pro user membuat resume tidak mengubah kredit

*Untuk semua* pro user dengan `resume_credits = N`, setelah berhasil membuat resume baru dalam jumlah berapa pun, nilai `resume_credits` harus tetap `N` (tidak berubah).

**Validates: Requirements 3.3**

---

### Property 7: Kredit tidak pernah turun di bawah 0

*Untuk semua* urutan operasi apapun pada sistem (termasuk pembuatan resume berulang, update, delete), nilai `resume_credits` pada setiap user tidak pernah kurang dari 0.

**Validates: Requirements 3.2, 10.3**

---

### Property 8: Update/delete relasi resume tidak mengubah kredit

*Untuk semua* user dengan `resume_credits = N`, melakukan operasi update atau delete pada entri education, experience, skills, projects, atau certificates tidak mengubah nilai `resume_credits` — nilai tetap `N`.

**Validates: Requirements 3.10, 10.7**

---

### Property 9: Validasi date range education dan experience

*Untuk semua* pasangan `(start_date, end_date)` di mana `end_date` secara kronologis lebih awal dari `start_date`, permintaan untuk menyimpan entri education atau experience harus selalu ditolak dengan respons 422.

**Validates: Requirements 3.11**

---

### Property 10: Round-trip data relasi resume

*Untuk semua* entri relasi resume yang valid (education, experience, skill, project, certificate) dengan nilai field yang acak, menyimpan entri tersebut lalu mengambilnya kembali via GET harus menghasilkan data yang identik dengan data yang disimpan.

**Validates: Requirements 3.5, 3.6, 3.7, 3.8, 3.9**

---

### Property 11: Free user rate limit AI — summary dan experience rewrite

*Untuk semua* free user yang telah menggunakan fitur AI summary atau AI experience rewrite tepat 10 kali pada hari kalender UTC yang sama, permintaan ke-11 pada hari yang sama harus selalu mendapatkan respons 429.

**Validates: Requirements 4.7, 5.7**

---

### Property 12: Free user rate limit AI — ATS score dan cover letter

*Untuk semua* free user yang telah menggunakan fitur ATS score atau cover letter tepat 3 kali pada hari kalender UTC yang sama, permintaan ke-4 pada hari yang sama harus selalu mendapatkan respons 429.

**Validates: Requirements 6.4, 7.5**

---

### Property 13: AI job polling mengembalikan shape yang konsisten

*Untuk semua* AI job yang valid milik user yang melakukan polling, respons polling harus selalu mengandung field `job_id`, `type`, `status`, dan — jika status `completed` — field `result` yang tidak kosong; jika status `failed` — field `error_message` yang tidak kosong.

**Validates: Requirements 4.9, 11.1, 11.2**

---

### Property 14: Polling job milik user lain selalu 403

*Untuk semua* pasangan user A dan user B (A ≠ B), jika user A mencoba polling status job yang dibuat oleh user B, respons harus selalu 403.

**Validates: Requirements 11.4**

---

### Property 15: Konfirmasi AI result tersimpan ke resume

*Untuk semua* teks valid yang dikirim ke endpoint konfirmasi AI summary atau experience rewrite, setelah konfirmasi berhasil, mengambil data resume via GET harus mengembalikan field yang bersangkutan (`summary` atau `description`) dengan nilai yang sama persis dengan teks yang dikonfirmasi.

**Validates: Requirements 4.5, 4.6, 5.5, 5.6**

---

### Property 16: Free user selalu ditolak akses template PDF pro

*Untuk semua* free user yang meminta ekspor PDF dengan template yang `is_pro = true`, respons harus selalu 403, tanpa pengecualian.

**Validates: Requirements 8.3**

---

### Property 17: Aktivasi public URL menghasilkan slug unik

*Untuk semua* resume yang di-toggle menjadi `is_public = true`, nilai `public_slug` yang dihasilkan harus unik di seluruh tabel `resumes` — tidak ada dua resume yang memiliki `public_slug` yang sama.

**Validates: Requirements 9.1, 9.6**

---

### Property 18: Resume private tidak dapat diakses via public URL

*Untuk semua* resume dengan `is_public = false`, akses ke URL publik (`/api/r/{slug}`) — baik oleh user anonim maupun user yang terautentikasi — harus selalu mendapatkan respons 404.

**Validates: Requirements 9.4**

---

### Property 19: Menonaktifkan public URL mempertahankan slug

*Untuk semua* resume yang pernah diaktifkan (`is_public = true`) sehingga memiliki `public_slug`, menonaktifkannya (`is_public = false`) tidak boleh menghapus atau mengubah nilai `public_slug` yang ada di database.

**Validates: Requirements 9.5**

---

### Property 20: Endpoint kredit selalu mengembalikan field lengkap

*Untuk semua* user yang terautentikasi, respons endpoint `/api/credits` harus selalu mengandung field `plan`, `resume_credits`, dan `active_subscription` (null jika tidak ada langganan aktif, atau objek dengan `plan_name` dan `expires_at` jika ada).

**Validates: Requirements 10.8**

---

## 13. Deployment Configuration

### 13.1 Environment Variables

**Backend (Railway):**
```env
APP_ENV=production
APP_KEY=base64:...
APP_URL=https://alresumebuilder-backend.railway.app
FRONTEND_URL=https://alresumebuilder.vercel.app

DB_CONNECTION=pgsql
DB_HOST=${RAILWAY_PRIVATE_DOMAIN}
DB_PORT=5432
DB_DATABASE=alresumebuilder
DB_USERNAME=postgres
DB_PASSWORD=${PGPASSWORD}

QUEUE_CONNECTION=database   # gunakan DB driver dulu, migrasi ke Redis jika perlu
CACHE_DRIVER=database

GEMINI_API_KEY=...
OPENAI_API_KEY=...

SANCTUM_STATEFUL_DOMAINS=alresumebuilder.vercel.app
SESSION_DOMAIN=.vercel.app
SESSION_DRIVER=cookie
```

**Frontend (Vercel):**
```env
NEXT_PUBLIC_API_URL=https://alresumebuilder-backend.railway.app
NEXT_PUBLIC_APP_URL=https://alresumebuilder.vercel.app
```

### 13.2 Railway Services

```
Railway Project: AlresumeBuilder
├── Service: backend (Laravel)
│   ├── Build: composer install --no-dev
│   ├── Start: php artisan serve --host=0.0.0.0 --port=$PORT
│   └── Workers: php artisan queue:work --tries=3
│
├── Service: PostgreSQL (Railway plugin)
│
└── Cron: php artisan schedule:run (setiap menit, Laravel scheduler)
```

---

## 14. Setup & Installation Checklist

Berdasarkan status saat ini (backend belum di-install, frontend scaffold default):

### Backend (Railway / lokal)
```bash
# 1. Install Laravel
cd backend
composer create-project laravel/laravel . "12.*"

# 2. Install Sanctum
composer require laravel/sanctum
php artisan install:api

# 3. Copy model dan migration files dari repo (timpa default Laravel)
# (Lihat backend/SETUP.md untuk detail lengkap)

# 4. Tambahkan migration baru
php artisan make:migration create_ai_jobs_table
php artisan make:migration create_pdf_templates_table
php artisan make:migration create_daily_ai_usage_table

# 5. Setup .env (PostgreSQL, Queue, AI keys)
# 6. php artisan migrate
# 7. php artisan db:seed (untuk seed pdf_templates default)
```

### Frontend (Vercel / lokal)
```bash
# Shadcn/ui belum ditambahkan — install sebelum mulai development
cd frontend
npx shadcn@latest init
npx shadcn@latest add button input card badge dialog progress textarea
npx shadcn@latest add tabs separator skeleton alert

# Install axios untuk API client
npm install axios js-cookie
npm install --save-dev @types/js-cookie
```
