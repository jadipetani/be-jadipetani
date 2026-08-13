# 🌾 Jadipetani Backend API

Backend RESTful API untuk platform **Jadipetani** — menghubungkan petani dengan mahasiswa/pelajar pertanian melalui program magang terstruktur, AI Curriculum Generator, AI Logbook, Sertifikat Magang Digital PDF, serta Job Connector (Lowongan Kerja Profesional & Payment Gateway).

---

## 🛠️ Tech Stack

- **Runtime**: Node.js v20+
- **Framework**: Express.js
- **Database**: PostgreSQL (Supabase Connection Pooler)
- **ORM**: Prisma Client v5.x
- **Authentication**: Custom JWT (Access Token 1h + Refresh Token in httpOnly Cookie 30d) + `bcrypt` (salt 12)
- **Storage**: Supabase Storage (`cv`, `portfolios`, `logbook-docs`, `certificates`)
- **AI Integration**: Google Gemini API (`@google/generative-ai`)
- **Email Service**: Resend API (`resend`)
- **PDF Generation**: PDFKit (`pdfkit`)
- **Payment Gateway**: Midtrans Snap (`midtrans-client`)
- **Validation**: Zod (`zod`)
- **Security**: Helmet, CORS, Express Rate Limit

---

## 🚀 Quick Start (Pengembangan Lokal)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/jadipetani/be-jadipetani.git
cd be-jadipetani
npm install
```

### 2. Setup Environment Variables
Salin `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```

Isi variabel environment di file `.env` (lihat tabel di bawah).

### 3. Database Migration & Seed Data
```bash
# Generate Prisma Client
npm run prisma:generate

# Jalankan Migrasi Database ke Supabase
npm run prisma:migrate

# Isi Data Demo / Testing
npm run prisma:seed
```

### 4. Jalankan Server (Development Mode)
```bash
npm run dev
```
Server akan aktif di `http://localhost:5000`.

---

## 📑 Akun Demo (Hasil Seeding)

| Role | Email | Password | Keterangan |
|------|-------|----------|------------|
| **Petani (FARMER)** | `petani@jadipetani.com` | `farmer123` | Pak Budi Sugiharto (Lembang) |
| **Pelajar (STUDENT)** | `pelajar@jadipetani.com` | `student123` | Ahmad Rizky (IPB University) |

---

## 🔑 Environment Variables Reference

| Variable | Deskripsi | Wajib |
|----------|-----------|-------|
| `NODE_ENV` | Environment mode (`development` / `production`) | ✅ |
| `PORT` | Port server (default: `5000`, Railway injects automatically) | ✅ |
| `DATABASE_URL` | Connection string PostgreSQL Supabase (Transaction Pooler) | ✅ |
| `DIRECT_URL` | Connection string PostgreSQL Supabase Direct (Session Pooler) | ✅ |
| `JWT_ACCESS_SECRET` | Secret key untuk sign access token (min 32 chars) | ✅ |
| `JWT_REFRESH_SECRET` | Secret key untuk sign refresh token (min 32 chars) | ✅ |
| `FRONTEND_URL` | URL aplikasi frontend (untuk CORS & email links) | ✅ |
| `SUPABASE_URL` | URL proyek Supabase | ✅ |
| `SUPABASE_SERVICE_KEY` | Service role key Supabase (bukan anon key) | ✅ |
| `GEMINI_API_KEY` | API Key Google Gemini AI Studio | ✅ |
| `MIDTRANS_SERVER_KEY` | Server Key Midtrans (Sandbox/Production) | ✅ |
| `MIDTRANS_CLIENT_KEY` | Client Key Midtrans | ✅ |
| `MIDTRANS_IS_PRODUCTION` | Mode Midtrans (`false` = Sandbox) | ✅ |
| `RESEND_API_KEY` | API Key Resend Email Service | ✅ |
| `SENTRY_DSN` | Sentry DSN untuk error tracking (opsional) | ❌ |

---

## 🔗 Endpoint Utama API

### 1. Health & Landing
- `GET /api/health` — Health check server
- `GET /api/landing/stats` — Statistik publik platform (petani, pelajar, program magang)

### 2. Authentication (`/api/auth`)
- `POST /api/auth/register` — Registrasi user (`FARMER` / `STUDENT`)
- `POST /api/auth/login` — Login user (dikembalikan access token + set refresh token cookie)
- `POST /api/auth/refresh-token` — Perbarui access token via httpOnly cookie
- `POST /api/auth/logout` — Logout user (hapus refresh cookie)
- `POST /api/auth/forgot-password` — Kirim email reset password
- `POST /api/auth/reset-password` — Reset password dengan token
- `GET /api/auth/me` — Dapatkan data user yang sedang login

### 3. Internship & Curriculum (`/api/internships`)
- `GET /api/internships` — List lowongan magang publik (search, filter, pagination)
- `GET /api/internships/my` — List lowongan milik petani login
- `GET /api/internships/:id` — Detail lowongan magang beserta kurikulum
- `POST /api/internships` — Buat lowongan magang (DRAFT/ACTIVE)
- `PUT /api/internships/:id` — Edit lowongan magang
- `PATCH /api/internships/:id/publish` — Publikasikan lowongan draft
- `DELETE /api/internships/:id` — Hapus soft-delete lowongan
- `POST /api/internships/:id/curriculum/generate` — Generate kurikulum terstruktur via Gemini AI
- `PUT /api/internships/:id/curriculum` — Edit manual kurikulum mingguan

### 4. Applications (`/api/internships` & `/api/applications`)
- `POST /api/internships/:id/apply` — Melamar magang (+ upload CV PDF max 5MB)
- `GET /api/internships/:id/applicants` — List pendaftar lowongan (Petani)
- `GET /api/applications/:id` — Detail lamaran (+ signed URL download CV/portfolio)
- `PATCH /api/applications/:id/accept` — Terima pendaftar (kuota di-enforce, logbook otomatis terbuat)
- `PATCH /api/applications/:id/reject` — Tolak pendaftar (+ notifikasi email)
- `PATCH /api/applications/:id/cancel` — Batalkan lamaran (Pelajar)

### 5. Logbook & Evaluation (`/api/logbook` & `/api/evaluations`)
- `GET /api/internships/:id/logbook?applicationId=xxx` — Summary progress logbook mingguan
- `GET /api/logbook/:entryId` — Detail logbook satu minggu (checklist + foto bukti)
- `PATCH /api/logbook/:entryId` — Simpan progress checklist & refleksi (Pelajar)
- `POST /api/logbook/:entryId/documentation` — Upload foto bukti kegiatan
- `DELETE /api/logbook/documentation/:docId` — Hapus foto bukti
- `GET /api/internships/:id/evaluations/:applicationId` — Dashboard evaluasi peserta (Petani)
- `PATCH /api/evaluations/:id/grade` — Simpan skor (1-100) & catatan mingguan
- `POST /api/internships/:id/evaluations/:appId/ai-summary` — Generate ringkasan evaluasi AI
- `POST /api/internships/:id/evaluations/:appId/graduate` — Luluskan peserta & terbitkan Sertifikat PDF

### 6. Certificates (`/api/certificates`)
- `GET /api/certificates/my` — List sertifikat milik pelajar
- `GET /api/certificates/:id` — Detail sertifikat
- `GET /api/certificates/:id/download` — Download PDF sertifikat dari Supabase Storage

### 7. Job Connector & Midtrans Payment (`/api/jobs` & `/api/payments`)
- `POST /api/jobs` — Buat lowongan kerja profesional (Placement Fee 50% dihitung di backend + initiate Midtrans Snap)
- `GET /api/jobs` — List lowongan kerja publik (`PUBLISHED` saja)
- `GET /api/jobs/my` — List lowongan kerja milik petani (semua status)
- `POST /api/jobs/:id/retry-payment` — Generate token Midtrans baru untuk payment retry
- `PATCH /api/jobs/:id/close` — Tutup lowongan kerja profesional
- `POST /api/payments/midtrans/callback` — Webhook listener Midtrans (verifikasi signature SHA512 & idempotency)
- `POST /api/payments/midtrans/reconcile` — Rekonsiliasi manual status pembayaran

---

## 🚆 Deployment ke Railway

1. Push repository ini ke GitHub.
2. Buat proyek baru di **[Railway.app](https://railway.app)** -> **"Deploy from GitHub repo"**.
3. Buka tab **Variables** di Railway dan masukkan variabel dari `.env` (tanpa `PORT`).
4. Buka **Settings** -> **Public Networking** -> Klik **"Generate Domain"**.
5. Salin URL publik Railway dan daftarkan ke **Midtrans Dashboard** -> **Payment Notification URL**:
   `https://<your-railway-domain>/api/payments/midtrans/callback`

---

## 🔒 Fitur Keamanan (Security Matrix)

- **Password Hashing**: `bcrypt` dengan 12 salt rounds.
- **Session Security**: JWT Access Token (1 jam) + Refresh Token di `httpOnly, Secure, SameSite=Strict` Cookie.
- **Rate Limiting**: Limiter khusus di endpoint sensitif (10 req/15 menit untuk auth, 100 req/15 menit global API).
- **Payment Security**: Verifikasi SHA512 `signature_key` dari Midtrans + Idempotency check untuk mencegah pemrosesan webhook ganda.
- **File Upload Security**: Pembatasan MIME type & ukuran maks 5MB, penamaan acak UUID v4, file tersimpan privat di Supabase Storage dengan access via Signed URL.
