# Setup Backend Laravel (lokal)

File migration dan model di folder ini **sudah siap pakai**, tapi Laravel core-nya
belum di-install (butuh akses Packagist yang tidak tersedia saat file ini dibuat).

## 1. Install Laravel di folder ini

```powershell
cd backend
composer create-project laravel/laravel . "12.*"
```

Ini akan generate ulang `database/migrations` bawaan Laravel — **hapus migration
bawaan users/cache/jobs default**, lalu copy migration yang sudah disiapkan di
`database/migrations/` (yang ada di repo ini sebelum instalasi) ke folder yang baru.

## 2. Install Sanctum

```powershell
composer require laravel/sanctum
php artisan install:api
```

## 3. Copy file yang sudah disiapkan

Pastikan struktur akhir seperti ini (timpa file default Laravel dengan file dari repo ini):

```
backend/
├── app/Models/
│   ├── User.php
│   ├── Subscription.php
│   ├── Resume.php
│   ├── Education.php
│   ├── Experience.php
│   ├── Skill.php
│   ├── Project.php
│   └── Certificate.php
└── database/migrations/
    ├── 2024_01_01_000001_create_users_table.php
    ├── 2024_01_01_000002_create_subscriptions_table.php
    ├── 2024_01_01_000003_create_resumes_table.php
    ├── 2024_01_01_000004_create_education_table.php
    ├── 2024_01_01_000005_create_experience_table.php
    ├── 2024_01_01_000006_create_skills_table.php
    ├── 2024_01_01_000007_create_projects_table.php
    └── 2024_01_01_000008_create_certificates_table.php
```

## 4. Setup .env & database PostgreSQL

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=alresumebuilder
DB_USERNAME=postgres
DB_PASSWORD=your_password
```

Buat database-nya dulu (via psql atau tool seperti TablePlus/pgAdmin):

```sql
CREATE DATABASE alresumebuilder;
```

## 5. Jalankan migration

```powershell
php artisan migrate
```

Kalau berhasil, akan muncul 8 tabel: `users`, `subscriptions`, `resumes`,
`education`, `experience`, `skills`, `projects`, `certificates` — plus tabel
bawaan Laravel (`password_reset_tokens`, `sessions`, `personal_access_tokens`
dari Sanctum).

## 6. Cek dengan Tinker (opsional)

```powershell
php artisan tinker
>>> App\Models\User::create(['name' => 'Test', 'email' => 't@t.com', 'password' => bcrypt('secret')]);
>>> App\Models\User::first()->resume_credits;
# => 5
```

## Catatan design

- Semua primary key pakai **UUID**, bukan auto-increment integer.
- Kolom `plan` (`free`/`pro`) dan `resume_credits` (default 5) ada di tabel `users`.
- Logic pengurangan kredit sudah disiapkan sebagai method di model:
  `$user->hasResumeCredits()` dan `$user->decrementResumeCredit()`.
  Panggil ini di `ResumeController@store` / `ResumeService::create()` nanti,
  jangan taruh logic bisnis langsung di controller.
