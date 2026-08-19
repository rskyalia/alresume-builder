# Requirements Document

## Introduction

AI Resume Builder (AlresumeBuilder) adalah aplikasi web yang membantu fresh graduate dan mahasiswa tingkat akhir membuat resume profesional yang lolos Applicant Tracking System (ATS). Aplikasi ini menyediakan fitur pembuat resume bertahap, peningkatan konten berbasis AI, analisis skor ATS, generator surat lamaran otomatis, ekspor PDF, dan berbagi resume via URL publik. Sistem menggunakan model kredit untuk monetisasi: user baru mendapat 5 kredit gratis, dengan opsi upgrade ke plan pro untuk akses tak terbatas.

Stack teknologi: frontend Next.js 16 + TypeScript + TailwindCSS v4 + shadcn/ui (Vercel), backend Laravel 12 + Sanctum + Queue + PostgreSQL (Railway), AI via Gemini API (primary) dengan OpenAI sebagai fallback opsional, PDF export server-side via Puppeteer.

---

## Glossary

- **System**: AlresumeBuilder — aplikasi web AI Resume Builder secara keseluruhan
- **AuthService**: Subsistem autentikasi berbasis Laravel Sanctum SPA
- **ResumeService**: Subsistem pengelolaan data resume (CRUD + credit check)
- **AIService**: Subsistem pemrosesan permintaan AI ke Gemini API / OpenAI, berjalan via Laravel Queue
- **ATSService**: Subsistem analisis dan penilaian resume terhadap kriteria ATS
- **CoverLetterService**: Subsistem pembuatan draft surat lamaran berbasis konten resume
- **PDFService**: Subsistem ekspor resume ke format PDF via Puppeteer (server-side)
- **ShareService**: Subsistem pengelolaan tautan publik resume
- **CreditService**: Subsistem pengelolaan kredit dan status langganan user
- **User**: Pengguna terdaftar yang memiliki akun di AlresumeBuilder
- **Free User**: User dengan `plan = free`, mendapat 5 kredit awal, dibatasi pada beberapa fitur AI
- **Pro User**: User dengan `plan = pro` (langganan aktif), akses tak terbatas ke semua fitur
- **Resume**: Dokumen CV milik User yang berisi Personal Info, Education, Experience, Skills, Projects, dan Certificates
- **Credit**: Satuan virtual yang dipotong setiap kali User membuat resume baru
- **ATS Score**: Nilai 0–100 yang merepresentasikan seberapa baik resume lolos sistem ATS
- **Cover Letter**: Draft surat lamaran yang dibuat otomatis berdasarkan konten Resume dan target posisi/perusahaan
- **Job Queue**: Antrian tugas asinkron Laravel untuk memproses permintaan AI di background
- **AI Job**: Sebuah unit pekerjaan asinkron di Job Queue yang memanggil AI Provider
- **AI Job Status**: Status pemrosesan AI Job — `pending`, `processing`, `completed`, `failed`
- **PDF Template**: Template HTML/CSS yang tersimpan di backend dan digunakan PDFService untuk merender resume
- **Public Slug**: String unik yang menjadi bagian dari URL publik resume
- **Rate Limit**: Batasan jumlah pemakaian fitur per hari untuk Free User
- **Subscription**: Catatan langganan pro User di tabel `subscriptions`
- **STAR Format**: Metode penulisan pengalaman kerja — Situation, Task, Action, Result

---

## Requirements

### Requirement 1: Autentikasi User

**User Story:** Sebagai calon pengguna, saya ingin mendaftar akun baru dan masuk ke aplikasi, sehingga saya dapat mengakses fitur resume builder secara personal dan aman.

#### Acceptance Criteria

1. WHEN User mengirimkan formulir registrasi dengan `name`, `email`, dan `password` yang valid, THE AuthService SHALL membuat akun baru dengan `plan = free`, `resume_credits = 5`, dan mengembalikan Sanctum SPA token beserta data User dalam respons 201.

2. WHEN User mengirimkan formulir registrasi dengan `email` yang sudah terdaftar, THE AuthService SHALL menolak permintaan dan mengembalikan respons 422 dengan pesan error "Email sudah digunakan."

3. WHEN User mengirimkan formulir login dengan `email` dan `password` yang sesuai, THE AuthService SHALL membuat sesi dan mengembalikan Sanctum SPA token beserta data User (termasuk `plan` dan `resume_credits`) dalam respons 200.

4. WHEN User mengirimkan formulir login dengan kredensial yang tidak sesuai, THE AuthService SHALL menolak permintaan dan mengembalikan respons 401 dengan pesan error "Kredensial tidak valid."

5. WHEN User yang sudah login melakukan permintaan logout, THE AuthService SHALL mencabut token aktif dan mengembalikan respons 200.

6. WHILE User belum terautentikasi, THE System SHALL memblokir akses ke semua rute yang dilindungi dan mengembalikan respons 401.

7. THE AuthService SHALL memvalidasi panjang `password` minimum 8 karakter sebelum menyimpan akun baru.

---

### Requirement 2: Dashboard

**User Story:** Sebagai User yang sudah login, saya ingin melihat daftar semua resume saya dan status kredit saya di satu halaman, sehingga saya dapat mengelola resume dengan mudah.

#### Acceptance Criteria

1. WHEN User mengakses endpoint dashboard, THE System SHALL mengembalikan daftar Resume milik User yang sedang login, terurut berdasarkan `updated_at` terbaru, dalam respons 200.

2. THE System SHALL menyertakan informasi `plan` dan `resume_credits` User pada respons endpoint dashboard.

3. WHEN User dengan `plan = free` dan `resume_credits = 0` menekan tombol buat resume baru, THE System SHALL menampilkan notifikasi bahwa kredit habis dan menawarkan opsi upgrade ke pro.

4. WHEN User menekan tombol hapus pada sebuah Resume di dashboard, THE ResumeService SHALL menghapus Resume beserta seluruh data relasinya (Education, Experience, Skills, Projects, Certificates) dan mengembalikan respons 200.

5. THE System SHALL menampilkan status `is_public` dari setiap Resume di daftar dashboard.

---

### Requirement 3: Resume Builder (Formulir Bertahap)

**User Story:** Sebagai User, saya ingin mengisi data resume saya melalui formulir bertahap yang terstruktur, sehingga proses pengisian terasa mudah dan tidak membebani.

#### Acceptance Criteria

1. WHEN Free User membuat Resume baru dan `resume_credits > 0`, THE ResumeService SHALL membuat record Resume baru, memanggil `decrementResumeCredit()` pada User, dan mengembalikan data Resume dalam respons 201.

2. WHEN Free User membuat Resume baru dan `resume_credits = 0`, THE ResumeService SHALL menolak pembuatan dan mengembalikan respons 403 dengan pesan "Kredit resume habis. Upgrade ke Pro untuk melanjutkan."

3. WHEN Pro User membuat Resume baru, THE ResumeService SHALL membuat record Resume baru tanpa memotong kredit dan mengembalikan data Resume dalam respons 201.

4. WHEN User menyimpan data Personal Info (Personal Info mencakup `full_name`, `phone`, `address`, dan `title`), THE ResumeService SHALL memperbarui record Resume dan mengembalikan data terbaru dalam respons 200.

5. WHEN User menambahkan entri Education dengan data `institution`, `degree`, `field_of_study`, `start_date`, dan `end_date`, THE ResumeService SHALL menyimpan entri Education dan mengembalikan data dalam respons 201.

6. WHEN User menambahkan entri Experience dengan data `company`, `position`, `start_date`, `end_date`, `is_current`, dan `description`, THE ResumeService SHALL menyimpan entri Experience dan mengembalikan data dalam respons 201.

7. WHEN User menambahkan entri Skill dengan data `name` dan `level`, THE ResumeService SHALL menyimpan entri Skill dan mengembalikan data dalam respons 201.

8. WHEN User menambahkan entri Project dengan data `name`, `description`, `url`, dan `tech_stack`, THE ResumeService SHALL menyimpan entri Project dan mengembalikan data dalam respons 201.

9. WHEN User menambahkan entri Certificate dengan data `name`, `issuer`, `issue_date`, dan `credential_url`, THE ResumeService SHALL menyimpan entri Certificate dan mengembalikan data dalam respons 201.

10. WHEN User memperbarui atau menghapus entri pada Education, Experience, Skills, Projects, atau Certificates, THE ResumeService SHALL memproses perubahan tanpa memotong kredit User dan mengembalikan respons 200 atau 204.

11. THE ResumeService SHALL memvalidasi bahwa `end_date` tidak lebih awal dari `start_date` pada entri Education dan Experience sebelum menyimpan data.

---

### Requirement 4: AI Summary Generator

**User Story:** Sebagai User, saya ingin menghasilkan ringkasan profil profesional secara otomatis dari data resume saya, sehingga saya tidak perlu menulisnya sendiri dari awal.

#### Acceptance Criteria

1. WHEN User meminta AI Summary untuk sebuah Resume, THE AIService SHALL mengantrekan sebuah AI Job ke Job Queue, menyimpan status `pending` di backend, dan mengembalikan `job_id` dalam respons 202.

2. WHEN AI Job untuk Summary diproses oleh Job Queue, THE AIService SHALL memanggil Gemini API dengan data Personal Info, Education, Experience, Skills, dan Projects dari Resume yang bersangkutan, lalu menghasilkan ringkasan 2–3 kalimat dalam format paragraf.

3. WHEN permintaan ke Gemini API gagal, THE AIService SHALL mencoba memanggil OpenAI API sebagai fallback. IF OpenAI API juga gagal, THEN THE AIService SHALL menandai AI Job sebagai `failed` dan menyimpan pesan error.

4. WHEN AI Job Summary selesai dengan status `completed`, THE AIService SHALL menyimpan hasil ringkasan sebagai draft (tidak langsung menimpa field `summary` di Resume) hingga User mengonfirmasi.

5. WHEN User mengonfirmasi hasil AI Summary, THE ResumeService SHALL menyimpan teks ringkasan ke field `summary` pada Resume dan mengembalikan respons 200.

6. WHEN User menolak atau mengedit hasil AI Summary sebelum menyimpan, THE System SHALL menerima teks yang dimodifikasi User dan menyimpannya ke field `summary` pada Resume.

7. WHEN Free User meminta AI Summary lebih dari 10 kali dalam satu hari kalender (UTC), THE AIService SHALL menolak permintaan dan mengembalikan respons 429 dengan pesan "Batas penggunaan harian tercapai."

8. WHEN Pro User meminta AI Summary, THE AIService SHALL memproses permintaan tanpa batasan jumlah per hari.

9. WHEN frontend melakukan polling status AI Job, THE System SHALL mengembalikan objek berisi `job_id`, `status` (`pending` | `processing` | `completed` | `failed`), dan `result` (jika `completed`) dalam respons 200.

---

### Requirement 5: AI Experience Rewrite

**User Story:** Sebagai User, saya ingin menulis ulang deskripsi pengalaman kerja saya secara otomatis menggunakan AI dengan format STAR, sehingga deskripsi terlihat lebih profesional di mata recruiter.

#### Acceptance Criteria

1. WHEN User meminta AI Experience Rewrite untuk sebuah entri Experience, THE AIService SHALL mengantrekan sebuah AI Job ke Job Queue, menyimpan status `pending` di backend, dan mengembalikan `job_id` dalam respons 202.

2. WHEN AI Job untuk Experience Rewrite diproses oleh Job Queue, THE AIService SHALL memanggil Gemini API dengan `company`, `position`, dan `description` dari entri Experience, lalu menghasilkan deskripsi ulang dalam format STAR dengan minimal 3 bullet point yang diawali action verb.

3. WHEN permintaan ke Gemini API gagal, THE AIService SHALL mencoba memanggil OpenAI API sebagai fallback. IF OpenAI API juga gagal, THEN THE AIService SHALL menandai AI Job sebagai `failed` dan menyimpan pesan error.

4. WHEN AI Job Experience Rewrite selesai dengan status `completed`, THE AIService SHALL menyimpan hasil tulisan ulang sebagai draft hingga User mengonfirmasi.

5. WHEN User mengonfirmasi hasil AI Experience Rewrite, THE ResumeService SHALL memperbarui field `description` pada entri Experience yang bersangkutan dan mengembalikan respons 200.

6. WHEN User menolak atau mengedit hasil AI Experience Rewrite sebelum menyimpan, THE System SHALL menerima teks yang dimodifikasi User dan menyimpannya ke field `description` pada entri Experience.

7. WHEN Free User meminta AI Experience Rewrite lebih dari 10 kali dalam satu hari kalender (UTC), THE AIService SHALL menolak permintaan dan mengembalikan respons 429 dengan pesan "Batas penggunaan harian tercapai."

8. WHEN Pro User meminta AI Experience Rewrite, THE AIService SHALL memproses permintaan tanpa batasan jumlah per hari.

---

### Requirement 6: ATS Score

**User Story:** Sebagai User, saya ingin mengetahui skor ATS resume saya beserta rekomendasi perbaikan, sehingga saya dapat meningkatkan peluang resume lolos seleksi otomatis.

#### Acceptance Criteria

1. WHEN User meminta ATS Score untuk sebuah Resume, THE ATSService SHALL mengantrekan sebuah AI Job ke Job Queue, menyimpan status `pending` di backend, dan mengembalikan `job_id` dalam respons 202.

2. WHEN AI Job untuk ATS Score diproses oleh Job Queue, THE ATSService SHALL memanggil Gemini API dengan seluruh konten Resume (Personal Info, Education, Experience, Skills, Projects, Certificates, Summary) dan menghasilkan skor 0–100 beserta minimal 3 rekomendasi perbaikan spesifik.

3. WHEN AI Job ATS Score selesai dengan status `completed`, THE ATSService SHALL menyimpan hasil skor dan rekomendasi yang dapat diambil frontend melalui endpoint polling status.

4. WHEN Free User meminta ATS Score lebih dari 3 kali dalam satu hari kalender (UTC), THE ATSService SHALL menolak permintaan dan mengembalikan respons 429 dengan pesan "Batas 3 analisis ATS per hari untuk akun Free tercapai."

5. WHEN Pro User meminta ATS Score, THE ATSService SHALL memproses permintaan tanpa batasan jumlah per hari.

6. WHEN permintaan ke Gemini API gagal, THE ATSService SHALL mencoba memanggil OpenAI API sebagai fallback. IF OpenAI API juga gagal, THEN THE ATSService SHALL menandai AI Job sebagai `failed` dan menyimpan pesan error.

7. THE ATSService SHALL mengembalikan hasil ATS Score dalam format JSON yang berisi field `score` (integer 0–100) dan `recommendations` (array of string).

---

### Requirement 7: Cover Letter Generator

**User Story:** Sebagai User, saya ingin membuat draft surat lamaran otomatis berdasarkan resume saya dan detail posisi yang dilamar, sehingga saya dapat melamar pekerjaan lebih cepat.

#### Acceptance Criteria

1. WHEN User meminta Cover Letter dengan menyediakan `company_name` dan `position_name`, THE CoverLetterService SHALL mengantrekan sebuah AI Job ke Job Queue, menyimpan status `pending` di backend, dan mengembalikan `job_id` dalam respons 202.

2. WHEN AI Job untuk Cover Letter diproses oleh Job Queue, THE CoverLetterService SHALL memanggil Gemini API dengan seluruh konten Resume yang relevan dan `company_name` serta `position_name` yang diberikan User, lalu menghasilkan draft surat lamaran profesional dalam format paragraf (minimal 3 paragraf).

3. WHEN permintaan ke Gemini API gagal, THE CoverLetterService SHALL mencoba memanggil OpenAI API sebagai fallback. IF OpenAI API juga gagal, THEN THE CoverLetterService SHALL menandai AI Job sebagai `failed` dan menyimpan pesan error.

4. WHEN AI Job Cover Letter selesai dengan status `completed`, THE CoverLetterService SHALL menyimpan hasil draft yang dapat diambil frontend melalui endpoint polling status.

5. WHEN Free User meminta Cover Letter lebih dari 3 kali dalam satu hari kalender (UTC), THE CoverLetterService SHALL menolak permintaan dan mengembalikan respons 429 dengan pesan "Batas 3 pembuatan surat lamaran per hari untuk akun Free tercapai."

6. WHEN Pro User meminta Cover Letter, THE CoverLetterService SHALL memproses permintaan tanpa batasan jumlah per hari.

7. THE System SHALL memvalidasi bahwa `company_name` dan `position_name` tidak kosong sebelum mengantrekan AI Job, dan mengembalikan respons 422 jika validasi gagal.

---

### Requirement 8: Ekspor PDF

**User Story:** Sebagai User, saya ingin mengunduh resume saya dalam format PDF menggunakan template pilihan, sehingga saya dapat mengirimkannya ke perusahaan dalam format yang profesional.

#### Acceptance Criteria

1. WHEN User meminta ekspor PDF untuk sebuah Resume, THE PDFService SHALL merender Resume menggunakan PDF Template yang dipilih via Puppeteer dan mengembalikan file PDF dalam respons 200 dengan header `Content-Type: application/pdf`.

2. THE System SHALL menyediakan minimal 2 PDF Template: template ATS-friendly single-column (tersedia untuk semua User) dan template visual/desain (tersedia khusus untuk Pro User).

3. WHEN Free User meminta ekspor PDF menggunakan template visual/desain, THE PDFService SHALL menolak permintaan dan mengembalikan respons 403 dengan pesan "Template ini tersedia untuk akun Pro."

4. THE PDFService SHALL mengambil daftar PDF Template yang tersedia dari backend (database atau file server) sehingga template baru dapat ditambahkan tanpa melakukan redeploy aplikasi.

5. WHEN User meminta ekspor PDF dengan `template` yang tidak ditemukan di backend, THE PDFService SHALL menggunakan template ATS-friendly single-column sebagai default dan melanjutkan proses ekspor.

6. THE PDFService SHALL menyelesaikan proses render dan pengiriman file PDF dalam waktu tidak lebih dari 30 detik.

---

### Requirement 9: Share URL (Tautan Publik Resume)

**User Story:** Sebagai User, saya ingin membagikan resume saya via tautan publik yang dapat diakses siapa saja tanpa login, sehingga recruiter dapat melihat resume saya secara langsung.

#### Acceptance Criteria

1. WHEN User mengaktifkan `is_public = true` pada sebuah Resume, THE ShareService SHALL menghasilkan `public_slug` unik (jika belum ada) dan menyimpannya pada record Resume, lalu mengembalikan URL publik dalam format `https://{domain}/r/{public_slug}` dalam respons 200.

2. WHEN pengguna anonim mengakses URL publik dengan `public_slug` yang valid, THE ShareService SHALL mengembalikan data Resume dalam respons 200 tanpa memerlukan autentikasi.

3. WHEN pengguna anonim mengakses URL publik dengan `public_slug` yang tidak ditemukan, THE ShareService SHALL mengembalikan respons 404.

4. WHEN pengguna anonim mengakses URL publik dari sebuah Resume dengan `is_public = false`, THE ShareService SHALL mengembalikan respons 404.

5. WHEN User menonaktifkan `is_public = false` pada sebuah Resume, THE ShareService SHALL menyimpan perubahan pada record Resume. THE System SHALL mempertahankan nilai `public_slug` yang ada agar dapat diaktifkan kembali di kemudian hari.

6. THE ShareService SHALL menjamin keunikan setiap `public_slug` yang dihasilkan di seluruh tabel resumes.

---

### Requirement 10: Sistem Kredit dan Monetisasi

**User Story:** Sebagai pengelola produk, saya ingin menerapkan sistem kredit dan langganan pro, sehingga AlresumeBuilder memiliki model monetisasi yang berkelanjutan.

#### Acceptance Criteria

1. WHEN akun User baru berhasil dibuat, THE CreditService SHALL menetapkan `resume_credits = 5` dan `plan = free` pada record User.

2. WHEN Free User berhasil membuat Resume baru, THE CreditService SHALL mengurangi `resume_credits` User sebesar 1. IF `resume_credits` setelah pengurangan sama dengan 0, THEN THE System SHALL menyertakan notifikasi "Kredit resume habis" dalam respons API.

3. THE CreditService SHALL memastikan `resume_credits` tidak pernah turun di bawah 0.

4. WHEN User melakukan pembayaran upgrade dan sebuah record Subscription dengan `status = active` berhasil dibuat, THE CreditService SHALL mengubah `plan` User menjadi `pro`.

5. WHEN sebuah cron job harian menemukan record Subscription dengan `expires_at` sebelum waktu saat ini dan `status = active`, THE CreditService SHALL mengubah `status` Subscription menjadi `expired` dan mengubah `plan` User yang bersangkutan menjadi `free`.

6. WHEN Pro User melakukan downgrade atau langganan berakhir, THE CreditService SHALL mempertahankan nilai `resume_credits` yang ada tanpa mengatur ulang ke 5.

7. THE System SHALL tidak memotong kredit saat User memperbarui data Resume yang sudah ada atau mengekspor Resume ke PDF.

8. WHEN User meminta informasi status kredit dan langganan, THE CreditService SHALL mengembalikan nilai `plan`, `resume_credits`, dan tanggal `expires_at` langganan aktif (jika ada) dalam respons 200.

---

### Requirement 11: Pengelolaan Status AI Job

**User Story:** Sebagai User, saya ingin mengetahui status pemrosesan AI secara real-time, sehingga saya tahu kapan hasil AI sudah siap untuk ditinjau.

#### Acceptance Criteria

1. THE AIService SHALL menyimpan setiap AI Job dengan field `id`, `type` (summary | experience_rewrite | ats_score | cover_letter), `status` (`pending` | `processing` | `completed` | `failed`), `resume_id`, `user_id`, `result`, dan `error_message`.

2. WHEN frontend melakukan request polling ke endpoint status AI Job, THE System SHALL mengembalikan data AI Job terkini dalam respons 200.

3. WHEN AI Job berpindah ke status `failed`, THE AIService SHALL menyimpan pesan error yang deskriptif ke field `error_message` dan mengembalikannya saat endpoint status di-polling.

4. WHEN User melakukan polling status AI Job milik User lain, THE System SHALL mengembalikan respons 403.

5. THE AIService SHALL memproses setiap AI Job menggunakan koneksi ke AI Provider yang terpisah dari request HTTP utama, melalui Laravel Queue worker.
