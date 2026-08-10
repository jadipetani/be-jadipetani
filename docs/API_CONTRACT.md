# API Contract — Jadipetani Backend

> Sumber kebenaran tunggal untuk semua endpoint REST API.
> Base URL: `/api`
> Format response: Lihat AGENTS.md section 4.3

---

## Daftar Isi
1. [Auth](#1-auth)
2. [User Profile](#2-user-profile)
3. [Internships (Magang)](#3-internships-magang)
4. [Curriculum (AI)](#4-curriculum-ai)
5. [Applications (Lamaran)](#5-applications-lamaran)
6. [Logbook](#6-logbook)
7. [Evaluation (Penilaian)](#7-evaluation-penilaian)
8. [Certificate (Sertifikat)](#8-certificate-sertifikat)
9. [Bookmarks (Simpan Lowongan)](#9-bookmarks-simpan-lowongan)
10. [Jobs (Job Connector)](#10-jobs-job-connector)
11. [Payments (Midtrans)](#11-payments-midtrans)
12. [Dashboard](#12-dashboard)
13. [Landing Page](#13-landing-page)

---

## Konvensi Umum

### Authentication
- Header: `Authorization: Bearer <access_token>`
- Refresh token: httpOnly cookie `refreshToken`

### Pagination (Query Params)
| Param | Type | Default | Deskripsi |
|-------|------|---------|-----------|
| `page` | number | 1 | Halaman ke-n |
| `limit` | number | 10 | Item per halaman (max 50) |

### Response Format
```json
// Success
{
  "success": true,
  "message": "string",
  "data": {},
  "meta": { "page": 1, "limit": 10, "total": 50, "totalPages": 5 }
}

// Error
{
  "success": false,
  "message": "string",
  "errors": [{ "field": "string", "message": "string" }]
}
```

### HTTP Status Codes
| Code | Penggunaan |
|------|-----------|
| 200 | OK (GET, PATCH berhasil) |
| 201 | Created (POST berhasil) |
| 204 | No Content (DELETE berhasil) |
| 400 | Bad Request |
| 401 | Unauthorized (token invalid/expired) |
| 403 | Forbidden (role tidak sesuai) |
| 404 | Not Found |
| 409 | Conflict (duplikat) |
| 422 | Validation Error |
| 429 | Too Many Requests |
| 500 | Internal Server Error |
| 503 | Service Unavailable (AI down) |

---

## 1. Auth

### `POST /api/auth/register`
Registrasi user baru.

**Rate Limited**: ✅ (10/15min)
**Auth**: ❌

**Request Body:**
```json
{
  "fullName": "string (2-100 chars)",
  "email": "string (valid email)",
  "password": "string (min 8 chars)",
  "confirmPassword": "string",
  "role": "FARMER | STUDENT",
  "agreedToTerms": true
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Registrasi berhasil",
  "data": {
    "user": {
      "id": "uuid",
      "fullName": "string",
      "email": "string",
      "role": "FARMER | STUDENT",
      "createdAt": "ISO 8601"
    },
    "accessToken": "string"
  }
}
```
> Refresh token dikirim via Set-Cookie httpOnly.

**Errors:**
| Code | Kondisi |
|------|---------|
| 409 | Email sudah terdaftar |
| 422 | Validasi gagal (password pendek, email invalid, dll) |

---

### `POST /api/auth/login`
Login user.

**Rate Limited**: ✅ (10/15min)
**Auth**: ❌

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "user": {
      "id": "uuid",
      "fullName": "string",
      "email": "string",
      "role": "FARMER | STUDENT"
    },
    "accessToken": "string"
  }
}
```

**Errors:**
| Code | Kondisi |
|------|---------|
| 401 | Email atau password salah (pesan generik) |

---

### `POST /api/auth/refresh-token`
Refresh access token menggunakan refresh token dari cookie.

**Auth**: ❌ (pakai cookie)

**Request**: Tidak ada body. Refresh token dibaca dari cookie `refreshToken`.

**Response 200:**
```json
{
  "success": true,
  "message": "Token diperbarui",
  "data": {
    "accessToken": "string"
  }
}
```

**Errors:**
| Code | Kondisi |
|------|---------|
| 401 | Refresh token tidak ada / expired / invalid |

---

### `POST /api/auth/logout`
Logout user, hapus refresh token cookie.

**Auth**: ✅

**Response 200:**
```json
{
  "success": true,
  "message": "Logout berhasil"
}
```

---

### `POST /api/auth/forgot-password`
Kirim email reset password.

**Rate Limited**: ✅ (10/15min)
**Auth**: ❌

**Request Body:**
```json
{
  "email": "string"
}
```

**Response 200:** (SELALU sukses, tidak reveal apakah email ada)
```json
{
  "success": true,
  "message": "Jika email terdaftar, kami akan mengirimkan link reset password"
}
```

---

### `POST /api/auth/reset-password`
Reset password dengan token.

**Auth**: ❌

**Request Body:**
```json
{
  "token": "string",
  "password": "string (min 8 chars)",
  "confirmPassword": "string"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Password berhasil diubah"
}
```

**Errors:**
| Code | Kondisi |
|------|---------|
| 400 | Token tidak valid atau sudah kedaluwarsa |

---

### `GET /api/auth/me`
Get current user profile.

**Auth**: ✅

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "fullName": "string",
    "email": "string",
    "role": "FARMER | STUDENT",
    "phone": "string | null",
    "address": "string | null",
    "institution": "string | null",
    "bio": "string | null",
    "createdAt": "ISO 8601"
  }
}
```

---

## 2. User Profile

### `GET /api/users/profile`
Ambil detail profil pengguna lengkap.

**Auth**: ✅

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "fullName": "string",
    "email": "string",
    "role": "FARMER | STUDENT",
    "phone": "string | null",
    "address": "string | null",
    "institution": "string | null",
    "bio": "string | null",
    "avatarUrl": "string | null",
    "createdAt": "ISO 8601"
  }
}
```

---

### `PUT /api/users/profile`
Update data profil user.

**Auth**: ✅

**Request Body:**
```json
{
  "fullName": "string (2-100 chars, optional)",
  "phone": "string (optional)",
  "address": "string (optional)",
  "institution": "string (optional, untuk STUDENT)",
  "bio": "string (max 500, optional)"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Profil berhasil diperbarui",
  "data": { "...user fields..." }
}
```

---

### `GET /api/users/profile/completion`
Hitung persentase kelengkapan profil (0-100%).

**Auth**: ✅

**Response 200:**
```json
{
  "success": true,
  "data": {
    "completionPercentage": 83,
    "filledFields": 5,
    "totalFields": 6,
    "isComplete": false
  }
}
```

---

### `POST /api/users/profile/avatar`
Upload foto profil ke Supabase Storage (bucket `avatars`).

**Auth**: ✅
**Content-Type**: `multipart/form-data`

**Form Fields:**
- `avatar`: File gambar (JPG/PNG/WebP, max 5MB)

**Response 200:**
```json
{
  "success": true,
  "message": "Foto profil berhasil diperbarui",
  "data": { "avatarUrl": "https://xxx.supabase.co/storage/v1/object/public/avatars/user-avatar.jpg" }
}
```

---

### `PUT /api/users/change-password`
Ganti password pengguna.

**Auth**: ✅

**Request Body:**
```json
{
  "currentPassword": "string",
  "newPassword": "string (min 8 chars)",
  "confirmNewPassword": "string"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Password berhasil diubah"
}
```

**Errors:**
| Code | Kondisi |
|------|---------|
| 401 | Password lama salah |
| 422 | Confirm new password tidak cocok |

---

### `DELETE /api/users/me`
Hapus akun pengguna permanen (cascading delete child records).

**Auth**: ✅

**Response 200:**
```json
{
  "success": true,
  "message": "Akun berhasil dihapus"
}
```

---

## 3. Internships (Magang)

### `POST /api/internships`
Buat lowongan magang baru (draft atau langsung publish).

**Auth**: ✅ | **Role**: FARMER

**Request Body:**
```json
{
  "title": "string (5-200 chars)",
  "commodity": "string (2-100 chars)",
  "location": "string (5-300 chars)",
  "durationMonths": "number (1-12)",
  "quota": "number (1-100)",
  "deadline": "ISO 8601 datetime",
  "facilities": "string (optional, max 1000 chars)",
  "description": "string (10-5000 chars)",
  "status": "DRAFT | ACTIVE"
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Lowongan magang berhasil dibuat",
  "data": {
    "id": "uuid",
    "title": "string",
    "commodity": "string",
    "location": "string",
    "durationMonths": 3,
    "durationWeeks": 12,
    "quota": 5,
    "acceptedCount": 0,
    "deadline": "ISO 8601",
    "facilities": "string",
    "description": "string",
    "status": "DRAFT | ACTIVE",
    "hasCurriculum": false,
    "userId": "uuid",
    "createdAt": "ISO 8601"
  }
}
```

---

### `GET /api/internships`
List lowongan magang aktif (publik).

**Auth**: ❌

**Query Params:**
| Param | Type | Deskripsi |
|-------|------|-----------|
| `page` | number | Halaman |
| `limit` | number | Item per halaman |
| `search` | string | Search by judul / komoditas |
| `location` | string | Filter by lokasi |
| `commodity` | string | Filter by komoditas |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "string",
      "commodity": "string",
      "location": "string",
      "durationMonths": 3,
      "quota": 5,
      "acceptedCount": 2,
      "deadline": "ISO 8601",
      "status": "ACTIVE",
      "farmer": {
        "id": "uuid",
        "fullName": "string"
      },
      "createdAt": "ISO 8601"
    }
  ],
  "meta": { "page": 1, "limit": 10, "total": 25, "totalPages": 3 }
}
```
> Hanya status `ACTIVE` yang ditampilkan. `DRAFT`, `CLOSED`, `DELETED` disembunyikan.

---

### `GET /api/internships/:id`
Detail lowongan magang (termasuk preview curriculum).

**Auth**: ❌

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "string",
    "commodity": "string",
    "location": "string",
    "durationMonths": 3,
    "durationWeeks": 12,
    "quota": 5,
    "acceptedCount": 2,
    "deadline": "ISO 8601",
    "facilities": "string",
    "description": "string",
    "status": "ACTIVE",
    "farmer": { "id": "uuid", "fullName": "string" },
    "curriculum": [
      {
        "weekNumber": 1,
        "title": "Persiapan Lahan",
        "description": "string",
        "activities": [
          { "name": "string", "description": "string", "weight": 25 }
        ]
      }
    ],
    "createdAt": "ISO 8601"
  }
}
```

---

### `PUT /api/internships/:id`
Edit lowongan magang (hanya pemilik, hanya DRAFT/ACTIVE).

**Auth**: ✅ | **Role**: FARMER

**Request Body:** Sama dengan POST (semua field opsional).

---

### `PATCH /api/internships/:id/publish`
Publish draft → active.

**Auth**: ✅ | **Role**: FARMER

**Response 200:**
```json
{
  "success": true,
  "message": "Lowongan berhasil dipublikasikan"
}
```

**Errors:**
| Code | Kondisi |
|------|---------|
| 400 | Kurikulum belum dibuat |
| 403 | Bukan pemilik lowongan |
| 404 | Lowongan tidak ditemukan |

---

### `DELETE /api/internships/:id`
Soft delete lowongan.

**Auth**: ✅ | **Role**: FARMER

**Response 200:**
```json
{
  "success": true,
  "message": "Lowongan berhasil dihapus"
}
```
> Jika ada pelamar, email notifikasi pembatalan dikirim ke semua pelamar.

---

### `GET /api/internships/my`
List lowongan milik petani (semua status, termasuk draft).

**Auth**: ✅ | **Role**: FARMER

**Query Params:** `page`, `limit`, `status` (filter by status)

---

## 4. Curriculum (AI)

### `POST /api/internships/:id/curriculum/generate`
Generate curriculum via Gemini AI.

**Auth**: ✅ | **Role**: FARMER

**Request**: Tidak ada body. Data diambil dari lowongan (commodity, durationWeeks, description).

**Response 200:**
```json
{
  "success": true,
  "message": "Kurikulum berhasil digenerate",
  "data": {
    "curriculum": [
      {
        "weekNumber": 1,
        "title": "Persiapan Lahan",
        "description": "Mempelajari teknik persiapan lahan...",
        "activities": [
          { "name": "Analisis kondisi tanah", "description": "...", "weight": 25 },
          { "name": "Pembersihan lahan", "description": "...", "weight": 25 },
          { "name": "Pengukuran area tanam", "description": "...", "weight": 25 },
          { "name": "Penyiapan alat pertanian", "description": "...", "weight": 25 }
        ]
      }
    ]
  }
}
```

**Errors:**
| Code | Kondisi |
|------|---------|
| 403 | Bukan pemilik lowongan |
| 503 | Gemini API tidak tersedia |

---

### `PUT /api/internships/:id/curriculum`
Update/edit curriculum (manual atau setelah generate).

**Auth**: ✅ | **Role**: FARMER

**Request Body:**
```json
{
  "curriculum": [
    {
      "weekNumber": 1,
      "title": "string",
      "description": "string",
      "activities": [
        { "name": "string", "description": "string", "weight": 25 }
      ]
    }
  ]
}
```
> Total weight per minggu HARUS = 100. Divalidasi backend.

---

### `GET /api/internships/:id/curriculum`
Get curriculum (preview publik).

**Auth**: ❌

---

## 5. Applications (Lamaran)

### `POST /api/internships/:id/apply`
Apply ke lowongan magang.

**Auth**: ✅ | **Role**: STUDENT
**Content-Type**: `multipart/form-data`

**Form Fields:**
| Field | Type | Required | Deskripsi |
|-------|------|----------|-----------|
| `cv` | file (PDF) | ✅ | CV, max 5MB |
| `portfolio` | file (PDF) | ❌ | Portofolio, max 5MB |
| `motivation` | string | ✅ | Motivasi, max 500 chars |

**Response 201:**
```json
{
  "success": true,
  "message": "Lamaran berhasil dikirim",
  "data": {
    "id": "uuid",
    "internshipId": "uuid",
    "studentId": "uuid",
    "cvUrl": "string",
    "portfolioUrl": "string | null",
    "motivation": "string",
    "status": "REVIEW",
    "createdAt": "ISO 8601"
  }
}
```

**Errors:**
| Code | Kondisi |
|------|---------|
| 400 | Lowongan tidak aktif / deadline terlewati |
| 400 | Sudah pernah apply ke lowongan ini |
| 400 | Sudah mencapai batas 5 lamaran aktif |
| 422 | File bukan PDF / melebihi 5MB |

---

### `GET /api/internships/:id/applicants`
List pendaftar lowongan.

**Auth**: ✅ | **Role**: FARMER

**Query Params:**
| Param | Type | Deskripsi |
|-------|------|-----------|
| `page`, `limit` | number | Pagination |
| `search` | string | Search by nama |
| `status` | string | Filter: REVIEW, ACCEPTED, REJECTED |
| `institution` | string | Filter by institusi |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "student": {
        "id": "uuid",
        "fullName": "string",
        "institution": "string | null"
      },
      "status": "REVIEW",
      "createdAt": "ISO 8601"
    }
  ],
  "meta": { "page": 1, "limit": 10, "total": 15, "totalPages": 2 }
}
```

---

### `GET /api/applications/:id`
Detail lamaran (termasuk CV URL, portofolio URL, motivasi).

**Auth**: ✅ | **Role**: FARMER (pemilik lowongan) atau STUDENT (pemilik lamaran)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "internship": { "id": "uuid", "title": "string" },
    "student": { "id": "uuid", "fullName": "string", "email": "string", "institution": "string" },
    "cvUrl": "signed URL (1 jam)",
    "portfolioUrl": "signed URL | null",
    "motivation": "string",
    "status": "REVIEW | ACCEPTED | REJECTED | CANCELLED",
    "createdAt": "ISO 8601",
    "updatedAt": "ISO 8601"
  }
}
```

---

### `PATCH /api/applications/:id/accept`
Terima pelamar.

**Auth**: ✅ | **Role**: FARMER

**Response 200:**
```json
{
  "success": true,
  "message": "Pelamar berhasil diterima"
}
```

**Errors:**
| Code | Kondisi |
|------|---------|
| 400 | Kuota penerimaan sudah penuh |
| 400 | Status lamaran bukan REVIEW |

> Side effects: Buat logbook entries otomatis, kirim email notifikasi ke pelajar.

---

### `PATCH /api/applications/:id/reject`
Tolak pelamar.

**Auth**: ✅ | **Role**: FARMER

> Side effect: Kirim email notifikasi ke pelajar.

---

### `PATCH /api/applications/:id/cancel`
Batalkan lamaran (oleh pelajar sendiri).

**Auth**: ✅ | **Role**: STUDENT

**Errors:**
| Code | Kondisi |
|------|---------|
| 400 | Status lamaran bukan REVIEW (sudah diproses) |

---

### `GET /api/applications/my`
Riwayat lamaran pelajar.

**Auth**: ✅ | **Role**: STUDENT

**Query Params:** `page`, `limit`, `type` (INTERNSHIP / JOB), `status`

---

## 6. Logbook

### `GET /api/internships/:id/logbook`
List semua minggu logbook untuk satu internship-application.

**Auth**: ✅ | **Role**: STUDENT (peserta) atau FARMER (pemilik program)

**Query Params:** `applicationId` (uuid, wajib)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "internship": { "id": "uuid", "title": "string" },
    "overallProgress": 62.5,
    "weeks": [
      {
        "id": "uuid",
        "weekNumber": 1,
        "title": "Persiapan Lahan",
        "status": "COMPLETED",
        "completionPercentage": 100,
        "documentationCount": 3,
        "hasReflection": true
      }
    ]
  }
}
```

---

### `GET /api/logbook/:entryId`
Detail satu minggu logbook.

**Auth**: ✅

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "weekNumber": 1,
    "title": "Persiapan Lahan",
    "description": "string",
    "status": "IN_PROGRESS",
    "completionPercentage": 75,
    "activities": [
      { "id": "uuid", "name": "string", "description": "string", "weight": 25, "isCompleted": true },
      { "id": "uuid", "name": "string", "description": "string", "weight": 25, "isCompleted": false }
    ],
    "documentations": [
      { "id": "uuid", "url": "signed URL", "createdAt": "ISO 8601" }
    ],
    "reflection": "string | null"
  }
}
```

---

### `PATCH /api/logbook/:entryId`
Update progress logbook (checklist + catatan).

**Auth**: ✅ | **Role**: STUDENT

**Request Body:**
```json
{
  "activities": [
    { "id": "uuid", "isCompleted": true }
  ],
  "reflection": "string (optional, max 2000 chars)"
}
```

---

### `POST /api/logbook/:entryId/documentation`
Upload bukti kegiatan.

**Auth**: ✅ | **Role**: STUDENT
**Content-Type**: `multipart/form-data`

**Form Fields:**
| Field | Type | Deskripsi |
|-------|------|-----------|
| `documentation` | file[] (image) | JPEG/PNG, max 5MB each, max 10 files |

---

### `DELETE /api/logbook/documentation/:docId`
Hapus satu bukti kegiatan.

**Auth**: ✅ | **Role**: STUDENT

---

## 7. Evaluation (Penilaian)

### `GET /api/internships/:internshipId/evaluations/:applicationId`
Get evaluasi peserta (semua minggu).

**Auth**: ✅ | **Role**: FARMER

**Response 200:**
```json
{
  "success": true,
  "data": {
    "student": { "id": "uuid", "fullName": "string" },
    "internship": { "id": "uuid", "title": "string" },
    "overallProgress": "7/8 Minggu (87%)",
    "weeks": [
      {
        "id": "uuid",
        "weekNumber": 1,
        "title": "Persiapan Lahan",
        "checklistScore": "4/4",
        "documentationCount": 3,
        "score": 85,
        "notes": "string | null",
        "status": "GRADED | PENDING"
      }
    ]
  }
}
```

---

### `PATCH /api/evaluations/:id/grade`
Simpan penilaian satu minggu.

**Auth**: ✅ | **Role**: FARMER

**Request Body:**
```json
{
  "score": "number (1-100)",
  "notes": "string (optional, max 1000 chars)"
}
```

---

### `POST /api/internships/:internshipId/evaluations/:applicationId/ai-summary`
Generate ringkasan AI (Gemini).

**Auth**: ✅ | **Role**: FARMER

**Response 200:**
```json
{
  "success": true,
  "data": {
    "overallScore": 82,
    "mainCompetencies": ["Persiapan lahan", "Teknik penanaman", "Perawatan tanaman"],
    "areasForImprovement": ["Pengendalian hama", "Manajemen irigasi"],
    "summary": "Peserta menunjukkan kemampuan yang baik dalam..."
  }
}
```

---

### `POST /api/internships/:internshipId/evaluations/:applicationId/graduate`
Luluskan peserta (trigger sertifikat).

**Auth**: ✅ | **Role**: FARMER

**Response 201:**
```json
{
  "success": true,
  "message": "Peserta berhasil diluluskan. Sertifikat sedang disiapkan.",
  "data": {
    "certificate": {
      "id": "uuid",
      "certificateNumber": "JP-CERT-2026-0001",
      "downloadUrl": "string"
    }
  }
}
```

**Errors:**
| Code | Kondisi |
|------|---------|
| 400 | Tidak ada minggu yang sudah dinilai |
| 400 | Peserta sudah pernah diluluskan |

---

## 8. Certificate (Sertifikat)

### `GET /api/certificates/:id`
Get data sertifikat.

**Auth**: ✅ | **Role**: STUDENT atau FARMER

---

### `GET /api/certificates/:id/download`
Download file PDF sertifikat. Return binary PDF.

**Auth**: ✅ | **Role**: STUDENT (pemilik)

**Response**: `Content-Type: application/pdf` (file download)

---

### `DELETE /api/certificates/:id`
Cabut / Hapus sertifikat.

**Auth**: ✅ | **Role**: FARMER

**Response 200:**
```json
{
  "success": true,
  "message": "Sertifikat berhasil dihapus"
}
```

---

## 9. Bookmarks (Simpan Lowongan)

### `POST /api/bookmarks`
Simpan / bookmark lowongan magang atau pekerjaan.

**Auth**: ✅ | **Role**: STUDENT

**Request Body:**
```json
{
  "internshipId": "uuid (optional)",
  "jobId": "uuid (optional)"
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Lowongan berhasil disimpan",
  "data": {
    "id": "uuid",
    "studentId": "uuid",
    "internshipId": "uuid | null",
    "jobId": "uuid | null",
    "createdAt": "ISO 8601"
  }
}
```

---

### `GET /api/bookmarks/my`
List seluruh bookmark milik pelajar.

**Auth**: ✅ | **Role**: STUDENT

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "internship": { "id": "uuid", "title": "string", "commodity": "string", "location": "string" },
      "job": null,
      "createdAt": "ISO 8601"
    }
  ]
}
```

---

### `DELETE /api/bookmarks/:id`
Hapus bookmark.

**Auth**: ✅ | **Role**: STUDENT

**Response 200:**
```json
{
  "success": true,
  "message": "Bookmark berhasil dihapus"
}
```

---

## 10. Jobs (Job Connector)

> **Fase berikutnya** (di luar MVP), tapi spesifikasi sudah lengkap.

### `POST /api/jobs`
Buat lowongan kerja + initiate payment.

**Auth**: ✅ | **Role**: FARMER

**Request Body:**
```json
{
  "title": "string (5-200 chars)",
  "location": "string (5-300 chars)",
  "description": "string (10-5000 chars)",
  "qualifications": "string (10-3000 chars)",
  "offeredSalary": "number (min 1000000)"
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Lowongan berhasil dibuat. Silakan selesaikan pembayaran.",
  "data": {
    "job": {
      "id": "uuid",
      "title": "string",
      "offeredSalary": 5000000,
      "placementFee": 2500000,
      "status": "PENDING_PAYMENT",
      "orderId": "JP-JOB-uuid-1691234567890"
    },
    "snapToken": "string (untuk Snap.js frontend)"
  }
}
```

---

### `GET /api/jobs`
List lowongan kerja published (publik).

**Auth**: ❌

**Query Params:** `page`, `limit`, `search`, `location`

> Hanya status `PUBLISHED` yang tampil.

---

### `GET /api/jobs/:id`
Detail lowongan kerja.

**Auth**: ❌

---

### `GET /api/jobs/my`
List lowongan milik petani (semua status).

**Auth**: ✅ | **Role**: FARMER

---

### `PATCH /api/jobs/:id/close`
Tutup lowongan manual.

**Auth**: ✅ | **Role**: FARMER

---

### `POST /api/jobs/:id/retry-payment`
Retry payment untuk lowongan yang pembayarannya gagal/expired.

**Auth**: ✅ | **Role**: FARMER

**Response 200:**
```json
{
  "success": true,
  "message": "Silakan selesaikan pembayaran",
  "data": {
    "snapToken": "string",
    "orderId": "JP-JOB-uuid-1691234567891"
  }
}
```

**Errors:**
| Code | Kondisi |
|------|---------|
| 400 | Status bukan PAYMENT_FAILED / EXPIRED |

---

### `POST /api/jobs/:id/apply`
Apply ke lowongan kerja.

**Auth**: ✅ | **Role**: STUDENT
**Content-Type**: `multipart/form-data`

**Form Fields:** Sama dengan apply magang (cv, portfolio, motivation).

---

### `GET /api/jobs/:id/applicants`
List pendaftar lowongan kerja.

**Auth**: ✅ | **Role**: FARMER

---

## 10. Payments (Midtrans)

### `POST /api/payments/midtrans/callback`
Webhook endpoint untuk notifikasi Midtrans.

**Auth**: ❌ (signature verification)
**Rate Limited**: ❌

**Request Body (dari Midtrans):**
```json
{
  "transaction_status": "settlement | pending | expire | cancel | deny",
  "order_id": "JP-JOB-uuid-timestamp",
  "status_code": "200",
  "gross_amount": "2500000.00",
  "signature_key": "sha512 hash",
  "payment_type": "string",
  "transaction_id": "string"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "OK"
}
```
> Selalu return 200 ke Midtrans (bahkan jika sudah diproses / idempotent).

---

### `POST /api/payments/midtrans/reconcile`
Manual reconciliation (fallback jika webhook gagal).

**Auth**: ✅ | **Role**: FARMER

**Request Body:**
```json
{
  "orderId": "JP-JOB-uuid-timestamp"
}
```

---

## 11. Dashboard

### `GET /api/dashboard/farmer`
Dashboard stats untuk Petani/Perusahaan.

**Auth**: ✅ | **Role**: FARMER

**Response 200:**
```json
{
  "success": true,
  "data": {
    "activeListings": 5,
    "newApplicants": 12,
    "activeInternships": 3,
    "certificatesIssued": 8
  }
}
```

---

### `GET /api/dashboard/student`
Dashboard stats untuk Pelajar/Pemuda.

**Auth**: ✅ | **Role**: STUDENT

**Response 200:**
```json
{
  "success": true,
  "data": {
    "activeApplications": 2,
    "activeInternships": 1,
    "certificatesEarned": 1
  }
}
```

---

## 12. Landing Page

### `GET /api/landing/stats`
Platform statistics (publik, untuk landing page).

**Auth**: ❌

**Response 200:**
```json
{
  "success": true,
  "data": {
    "registeredFarmers": 150,
    "activeStudents": 320,
    "internshipPrograms": 45,
    "connectedLands": 80
  }
}
```
> Angka dihitung dari data real di database (bukan hardcoded).
