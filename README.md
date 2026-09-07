<p align="center">
  <img src="https://raw.githubusercontent.com/jadipetani/be-jadipetani/main/docs/logo-jadipetani.jpg" alt="Jadipetani Logo" width="100" />
</p>

<h1 align="center">⚙️ Jadipetani — Backend API</h1>

<p align="center">
  Backend RESTful API untuk platform <strong>Jadipetani</strong> — menghubungkan petani dengan pelajar melalui program magang terstruktur, AI Curriculum Generator, AI Logbook, Sertifikat Digital PDF, serta Job Connector & Payment Gateway.
</p>

---

## 🛠️ Tech Stack

| Kategori | Teknologi |
|----------|-----------|
| **Runtime** | Node.js v20+ |
| **Framework** | Express.js 5 |
| **Database** | PostgreSQL 15 (Supabase Connection Pooler) |
| **ORM** | Prisma Client v5.x |
| **Autentikasi** | JWT (Access Token 1h + Refresh Token httpOnly Cookie 30d) + bcrypt (salt 12) |
| **Storage** | Supabase Storage (`cv`, `portfolios`, `logbook-docs`, `certificates`) |
| **AI** | Google Gemini API (`@google/generative-ai`) |
| **Email** | Resend API |
| **PDF** | PDFKit |
| **Payment** | Midtrans Snap (`midtrans-client`) |
| **Validasi** | Zod |
| **Keamanan** | Helmet, CORS, Express Rate Limit |

---

## 🚀 Panduan Instalasi

### Prasyarat

- **Node.js** ≥ 20.x
- **npm** ≥ 9.x
- **PostgreSQL** (disarankan via Supabase)

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/jadipetani/be-jadipetani.git
cd be-jadipetani
npm install
```

### 2. Setup Environment Variables

```bash
cp .env.example .env
```

Isi variabel di file `.env` (lihat tabel di bawah).

### 3. Database Migration & Seed Data

```bash
# Generate Prisma Client
npm run prisma:generate

# Jalankan migrasi database
npm run prisma:migrate

# Isi data demo
npm run prisma:seed
```

### 4. Jalankan Server (Development)

```bash
npm run dev
```

Server aktif di `http://localhost:5000`.

---

## 🔑 Environment Variables

| Variable | Deskripsi | Wajib |
|----------|-----------|-------|
| `NODE_ENV` | `development` / `production` | ✅ |
| `PORT` | Port server (default: `5000`) | ✅ |
| `DATABASE_URL` | Connection string PostgreSQL (Transaction Pooler) | ✅ |
| `DIRECT_URL` | Connection string PostgreSQL (Session Pooler) | ✅ |
| `JWT_ACCESS_SECRET` | Secret key access token (min 32 chars) | ✅ |
| `JWT_REFRESH_SECRET` | Secret key refresh token (min 32 chars) | ✅ |
| `FRONTEND_URL` | URL frontend (untuk CORS & email links) | ✅ |
| `SUPABASE_URL` | URL proyek Supabase | ✅ |
| `SUPABASE_SERVICE_KEY` | Service role key Supabase (bukan anon key) | ✅ |
| `GEMINI_API_KEY` | API Key Google Gemini AI Studio | ✅ |
| `MIDTRANS_SERVER_KEY` | Server Key Midtrans (Sandbox/Production) | ✅ |
| `MIDTRANS_CLIENT_KEY` | Client Key Midtrans | ✅ |
| `MIDTRANS_IS_PRODUCTION` | Mode Midtrans (`false` = Sandbox) | ✅ |
| `RESEND_API_KEY` | API Key Resend Email Service | ✅ |
| `SENTRY_DSN` | Sentry DSN error tracking (opsional) | ❌ |

---

## 📑 Akun Demo (Hasil Seeding)

| Role | Email | Password | Keterangan |
|------|-------|----------|------------|
| **Petani (FARMER)** | `petani@jadipetani.com` | `farmer123` | Pak Budi Sugiharto — Lembang, Bandung Barat |
| **Pelajar (STUDENT)** | `pelajar@jadipetani.com` | `student123` | Ahmad Rizky — IPB University |

---

## 🧪 Spesifikasi Lingkungan Pengujian

| Komponen | Spesifikasi |
|----------|-------------|
| **OS** | Windows 11 / macOS 14+ / Ubuntu 22.04 |
| **Node.js** | v20.18.0 |
| **npm** | v10.8.2 |
| **Database** | PostgreSQL 15 (Supabase) |
| **API Base URL (Dev)** | `http://localhost:5000/api` |
| **API Base URL (Prod)** | `https://be-jadipetani-production.up.railway.app/api` |
| **Midtrans** | Sandbox Mode |

---

## 🔗 Endpoint Utama API

### Health & Landing
- `GET /api/health` — Health check server
- `GET /api/landing/stats` — Statistik publik platform

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Registrasi user (FARMER / STUDENT)
- `POST /api/auth/login` — Login (access token + refresh cookie)
- `POST /api/auth/refresh-token` — Perbarui access token
- `POST /api/auth/logout` — Logout (hapus refresh cookie)
- `POST /api/auth/forgot-password` — Kirim email reset password
- `POST /api/auth/reset-password` — Reset password dengan token
- `GET /api/auth/me` — Data user yang login

### Internship & Curriculum (`/api/internships`)
- `GET /api/internships` — List lowongan magang publik (search, filter, pagination)
- `GET /api/internships/my` — List lowongan milik petani
- `GET /api/internships/:id` — Detail lowongan + kurikulum
- `POST /api/internships` — Buat lowongan magang
- `PUT /api/internships/:id` — Edit lowongan
- `PATCH /api/internships/:id/publish` — Publikasikan lowongan
- `DELETE /api/internships/:id` — Hapus lowongan
- `POST /api/internships/:id/curriculum/generate` — Generate kurikulum AI (Gemini)
- `PUT /api/internships/:id/curriculum` — Edit kurikulum manual

### Applications (`/api/internships` & `/api/applications`)
- `POST /api/internships/:id/apply` — Melamar magang (+ upload CV)
- `GET /api/internships/:id/applicants` — List pendaftar (Petani)
- `GET /api/applications/:id` — Detail lamaran
- `PATCH /api/applications/:id/accept` — Terima pendaftar
- `PATCH /api/applications/:id/reject` — Tolak pendaftar
- `PATCH /api/applications/:id/cancel` — Batalkan lamaran (Pelajar)

### Logbook & Evaluation (`/api/logbook` & `/api/evaluations`)
- `GET /api/internships/:id/logbook` — Summary logbook mingguan
- `GET /api/logbook/:entryId` — Detail logbook satu minggu
- `PATCH /api/logbook/:entryId` — Simpan progress & refleksi
- `POST /api/logbook/:entryId/documentation` — Upload foto bukti
- `DELETE /api/logbook/documentation/:docId` — Hapus foto bukti
- `GET /api/internships/:id/evaluations/:applicationId` — Dashboard evaluasi
- `PATCH /api/evaluations/:id/grade` — Simpan skor & catatan
- `POST /api/internships/:id/evaluations/:appId/ai-summary` — Ringkasan evaluasi AI
- `POST /api/internships/:id/evaluations/:appId/graduate` — Luluskan & terbitkan sertifikat

### Certificates (`/api/certificates`)
- `GET /api/certificates/my` — List sertifikat pelajar
- `GET /api/certificates/:id` — Detail sertifikat
- `GET /api/certificates/:id/download` — Download PDF sertifikat

### Job Connector & Payment (`/api/jobs` & `/api/payments`)
- `POST /api/jobs` — Buat lowongan kerja (+ Midtrans Snap)
- `GET /api/jobs` — List lowongan kerja publik
- `GET /api/jobs/my` — List lowongan milik petani
- `POST /api/jobs/:id/retry-payment` — Retry payment Midtrans
- `PATCH /api/jobs/:id/close` — Tutup lowongan
- `POST /api/payments/midtrans/callback` — Webhook Midtrans
- `POST /api/payments/midtrans/reconcile` — Rekonsiliasi manual

---

## 🚆 Deployment (Railway)

1. Push repository ke GitHub
2. Buat proyek di **[Railway.app](https://railway.app)** → Deploy from GitHub repo
3. Isi **Variables** di Railway (tanpa `PORT`)
4. Buka **Settings** → **Public Networking** → Generate Domain
5. Daftarkan URL ke **Midtrans Dashboard** → Payment Notification URL:
   `https://<your-railway-domain>/api/payments/midtrans/callback`

---

## 🔒 Keamanan

- **Password**: Hashing bcrypt (12 salt rounds)
- **Session**: JWT Access Token (1 jam) + Refresh Token httpOnly Cookie (30 hari)
- **Rate Limiting**: 10 req/15 menit (auth) — 100 req/15 menit (global)
- **Payment**: Verifikasi SHA512 signature Midtrans + Idempotency check
- **Upload**: Validasi MIME type, maks 5MB, UUID v4, penyimpanan privat Supabase

---

## 📄 Lisensi

Proyek ini dikembangkan untuk keperluan akademik.
