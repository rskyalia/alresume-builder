# AlresumeBuilder

AI-powered resume & cover letter builder yang membantu fresh graduate dan mahasiswa membuat CV profesional dan lolos ATS (Applicant Tracking System).

Pengguna baru mendapat **5 kredit** gratis untuk membuat resume. Setelah habis, tersedia paket berlangganan Pro untuk kredit tidak terbatas beserta template premium.

---

## Fitur Utama

- **Autentikasi** — Register, login, dan logout via Laravel Sanctum (cookie-based SPA auth)
- **Dashboard Resume** — Buat, edit, dan hapus resume; tampilkan sisa kredit dan status plan
- **Resume Builder** — Isi semua section: Personal Info, Pendidikan, Pengalaman, Skill, Proyek, Sertifikat
- **AI Summary** — Generate ringkasan profil otomatis menggunakan Gemini / OpenAI
- **AI Experience Rewrite** — Tulis ulang deskripsi pengalaman dalam format STAR dengan action verb
- **ATS Score** — Analisis skor ATS resume beserta rekomendasi perbaikan
- **Cover Letter** — Generate cover letter berdasarkan posisi dan perusahaan yang dituju
- **Export PDF** — Download resume sebagai PDF (template ATS Friendly gratis, Modern Visual untuk Pro)
- **Share URL** — Bagikan resume lewat public link tanpa login
- **Sistem Kredit & Langganan** — 5 kredit gratis; upgrade ke Pro untuk kredit tidak terbatas

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, TailwindCSS v4, shadcn/ui |
| Backend | Laravel 12, Sanctum, Queue (database driver) |
| Database | PostgreSQL 15+ |
| AI | Google Gemini (utama), OpenAI GPT (fallback) |
| PDF | Puppeteer (Node.js) |
| Deployment | Vercel (frontend), Railway (backend + worker) |

---

## Prasyarat

Pastikan semua tools berikut sudah terinstall di mesin lokal:

- **PHP** 8.2 atau lebih baru
- **Composer** 2.x
- **Node.js** 20 atau lebih baru & **npm**
- **PostgreSQL** 15 atau lebih baru
- **Git**

---

## Struktur Project

```
AlresumeBuilder/
├── backend/        # Laravel 12 API
├── frontend/       # Next.js 16 app
├── assets/         # Gambar, ikon, dan aset statis
└── README.md
```

---

## Setup Backend

### 1. Masuk ke folder backend

```bash
cd backend
```

### 2. Copy file environment

```bash
cp .env.example .env
```

### 3. Install dependencies PHP

```bash
composer install
```

### 4. Generate application key

```bash
php artisan key:generate
```

### 5. Konfigurasi database

Buka `.env` dan sesuaikan nilai berikut dengan database PostgreSQL lokal kamu:

```env
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=alresume
DB_USERNAME=postgres
DB_PASSWORD=your-password
```

Buat database terlebih dahulu jika belum ada:

```sql
CREATE DATABASE alresume;
```

### 6. Konfigurasi API Keys AI

Masukkan API key di `.env`:

```env
GEMINI_API_KEY=your-gemini-api-key
OPENAI_API_KEY=your-openai-api-key
```

Salah satu key sudah cukup untuk menjalankan fitur AI. Gemini digunakan sebagai provider utama dengan OpenAI sebagai fallback.

### 7. Jalankan migrasi dan seeder

```bash
php artisan migrate --seed
```

Seeder akan membuat 2 template PDF: `ATS Friendly` (gratis) dan `Modern Visual` (Pro).

### 8. Jalankan development server

```bash
php artisan serve
```

Backend berjalan di `http://localhost:8000`.

### 9. Jalankan Queue worker (wajib untuk fitur AI)

Buka terminal terpisah dan jalankan:

```bash
php artisan queue:work
```

Queue worker diperlukan agar job AI (summary, experience rewrite, ATS score, cover letter) dapat diproses. Tanpa worker aktif, semua trigger AI akan tersimpan di queue tapi tidak dieksekusi.

---

## Setup Frontend

### 1. Masuk ke folder frontend

```bash
cd frontend
```

### 2. Copy file environment

```bash
cp .env.local.example .env.local
```

### 3. Konfigurasi URL backend

Buka `.env.local` dan pastikan URL backend sudah benar:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Install dependencies Node.js

```bash
npm install
```

### 5. Jalankan development server

```bash
npm run dev
```

Frontend berjalan di `http://localhost:3000`.

---

## Variabel Lingkungan

### Backend (`backend/.env`)

| Variabel | Deskripsi | Contoh |
|---|---|---|
| `APP_KEY` | Application key Laravel (di-generate otomatis) | `base64:...` |
| `APP_URL` | URL backend | `http://localhost:8000` |
| `APP_ENV` | Environment aktif | `local` / `production` |
| `APP_DEBUG` | Mode debug (nonaktifkan di production) | `true` / `false` |
| `FRONTEND_URL` | URL frontend untuk CORS | `http://localhost:3000` |
| `DB_HOST` | Host database PostgreSQL | `127.0.0.1` |
| `DB_PORT` | Port database | `5432` |
| `DB_DATABASE` | Nama database | `alresume` |
| `DB_USERNAME` | Username database | `postgres` |
| `DB_PASSWORD` | Password database | — |
| `SESSION_DRIVER` | Driver session | `cookie` (production) / `database` (lokal) |
| `SESSION_DOMAIN` | Domain session untuk cookie | `.your-domain.com` |
| `SANCTUM_STATEFUL_DOMAINS` | Domain frontend yang boleh akses Sanctum | `localhost:3000` |
| `QUEUE_CONNECTION` | Driver queue | `database` |
| `CACHE_STORE` | Driver cache | `database` |
| `GEMINI_API_KEY` | API key Google Gemini | `AIza...` |
| `OPENAI_API_KEY` | API key OpenAI (fallback) | `sk-...` |
| `AI_PROVIDER` | Provider AI utama | `gemini` |

### Frontend (`frontend/.env.local`)

| Variabel | Deskripsi | Contoh |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | URL API backend | `http://localhost:8000` |
| `NEXT_PUBLIC_APP_URL` | URL app frontend | `http://localhost:3000` |

---

## Menjalankan Tests

### Backend (Pest PHP)

```bash
cd backend
php artisan test
```

Untuk menjalankan test dengan database fresh:

```bash
php artisan migrate:fresh --seed && php artisan test
```

### Frontend (ESLint)

```bash
cd frontend
npm run lint
```

---

## Build Production

### Backend

```bash
cd backend
composer install --no-dev --optimize-autoloader
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan migrate --force
```

### Frontend

```bash
cd frontend
npm run build
npm run start
```

---

## Deployment

### Railway (Backend)

1. Buat project baru di [Railway](https://railway.app)
2. Tambahkan service **Laravel** dari repository ini (folder `backend/`)
3. Tambahkan service **PostgreSQL** dan copy connection string ke `.env`
4. Set semua environment variables sesuai `backend/.env.example`
5. Tambahkan service terpisah untuk **Queue Worker** dengan start command: `php artisan queue:work --tries=3`

### Vercel (Frontend)

1. Import repository ke [Vercel](https://vercel.com)
2. Set **Root Directory** ke `frontend`
3. Tambahkan environment variables: `NEXT_PUBLIC_API_URL` dan `NEXT_PUBLIC_APP_URL`
4. Deploy

---

## Monetisasi

- User baru mendapat **5 kredit** gratis untuk membuat resume baru.
- 1 kredit digunakan setiap kali user membuat resume baru. Edit, export, dan share tidak memotong kredit.
- Setelah kredit habis, user perlu upgrade ke plan **Pro** untuk membuat resume baru tanpa batas.
- Rate limit fitur AI berlaku untuk free user: 10x/hari untuk summary & experience rewrite, 3x/hari untuk ATS score & cover letter. Pro user tidak dibatasi.

---

## License

TBD
