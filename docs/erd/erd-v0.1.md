# ERD — AI Resume Builder (v0.1)

GitHub otomatis merender diagram mermaid di bawah ini.

```mermaid
erDiagram
  USERS ||--o{ RESUMES : owns
  USERS ||--o{ SUBSCRIPTIONS : subscribes
  RESUMES ||--o{ EDUCATION : has
  RESUMES ||--o{ EXPERIENCE : has
  RESUMES ||--o{ SKILLS : has
  RESUMES ||--o{ PROJECTS : has
  RESUMES ||--o{ CERTIFICATES : has

  USERS {
    uuid id PK
    string name
    string email
    string password
    string plan "free | pro"
    int resume_credits "default 5"
    timestamp created_at
  }
  SUBSCRIPTIONS {
    uuid id PK
    uuid user_id FK
    string plan_name
    string status
    decimal price
    string payment_ref
    timestamp started_at
    timestamp expires_at
  }
  RESUMES {
    uuid id PK
    uuid user_id FK
    string title
    string template
    string full_name
    string phone
    string address
    text summary "AI generated"
    boolean is_public
    string public_slug
    timestamp created_at
  }
  EDUCATION {
    uuid id PK
    uuid resume_id FK
    string institution
    string degree
    string field_of_study
    date start_date
    date end_date
    string gpa
  }
  EXPERIENCE {
    uuid id PK
    uuid resume_id FK
    string company
    string position
    date start_date
    date end_date
    boolean is_current
    text description "AI-assisted"
  }
  SKILLS {
    uuid id PK
    uuid resume_id FK
    string name
    string level
  }
  PROJECTS {
    uuid id PK
    uuid resume_id FK
    string name
    text description
    string url
    string tech_stack
  }
  CERTIFICATES {
    uuid id PK
    uuid resume_id FK
    string name
    string issuer
    date issue_date
    string credential_url
  }
```

## Business logic notes

- 1 kredit dipotong hanya saat `INSERT` baru ke tabel `resumes` (create), bukan `UPDATE`.
- Cek kredit sebaiknya dilakukan di service layer (`ResumeService::create()`), bukan di controller.
- Saat `subscriptions` status berubah jadi `active`, update `users.plan = 'pro'`.
- Cron job harian mengecek `subscriptions.expires_at` — jika lewat, `users.plan` kembali ke `free`.
