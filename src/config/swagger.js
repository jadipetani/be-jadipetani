const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: '🌾 Jadipetani Backend API',
    version: '1.0.0',
    description: 'Dokumentasi interaktif RESTful API Jadipetani — Magang Pertanian, AI Logbook, AI Curriculum Generator, Sertifikat Digital PDF, Bookmarks, dan Job Connector.',
  },
  servers: [
    {
      url: 'https://be-jadipetani-production.up.railway.app',
      description: 'Production Server (Railway)',
    },
    {
      url: 'http://localhost:5000',
      description: 'Development Server (Lokal)',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Masukkan Access Token JWT (didapat dari /api/auth/login)',
      },
    },
  },
  tags: [
    { name: 'Health', description: 'Server Health Check' },
    { name: 'Landing', description: 'Statistik Platform Publik' },
    { name: 'Authentication', description: 'Registrasi, Login, Refresh Token, Reset Password' },
    { name: 'User Profile', description: 'Profil User, Kelengkapan Profil, Upload Avatar, Ganti Password' },
    { name: 'Internships', description: 'CRUD Lowongan Magang Pertanian & Publikasi' },
    { name: 'AI Curriculum', description: 'AI Generator Kurikulum Mingguan (Gemini API) & CRUD' },
    { name: 'Applications', description: 'Lamaran Magang & Pekerjaan (Upload CV & Portfolio)' },
    { name: 'Applicant Management', description: 'Manajemen Pelamar oleh Petani (Terima/Tolak & Enforce Kuota)' },
    { name: 'My Internships & AI Logbook', description: 'Program Magang Pelajar, Checklist Logbook & Upload Bukti Dokumentasi' },
    { name: 'Evaluation & Certificate', description: 'Penilaian Mingguan, AI Summary Gemini, & Kelulusan / Sertifikat PDF' },
    { name: 'Certificates', description: 'Detail, List, Download PDF, & Pencabutan Sertifikat Digital' },
    { name: 'Job Connector', description: 'Lowongan Kerja Profesional, Midtrans Payment (50% Fee), & Reconcile' },
    { name: 'Payments', description: 'Midtrans Snap Webhook Callback (SHA-512 Signature & Idempotent)' },
    { name: 'Bookmarks', description: 'Simpan / Bookmark Lowongan Magang & Pekerjaan' },
    { name: 'Dashboard', description: 'Statistik Ringkasan Dashboard Petani & Pelajar' },
  ],
  paths: {
    // 1. Health
    '/api/health': {
      get: {
        summary: 'Health Check Server',
        tags: ['Health'],
        responses: { 200: { description: 'Server berjalan normal' } },
      },
    },

    // 2. Landing
    '/api/landing/stats': {
      get: {
        summary: 'Statistik Platform (Publik)',
        tags: ['Landing'],
        responses: { 200: { description: 'Statistik agregat platform' } },
      },
    },

    // 3. Auth
    '/api/auth/register': {
      post: {
        summary: 'Registrasi User Baru (FARMER / STUDENT)',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['fullName', 'email', 'password', 'confirmPassword', 'role', 'agreedToTerms'],
                properties: {
                  fullName: { type: 'string', example: 'Ahmad Rizky' },
                  email: { type: 'string', example: 'pelajar@jadipetani.com' },
                  password: { type: 'string', example: 'password123' },
                  confirmPassword: { type: 'string', example: 'password123' },
                  role: { type: 'string', enum: ['FARMER', 'STUDENT'], example: 'STUDENT' },
                  agreedToTerms: { type: 'boolean', example: true },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Registrasi berhasil' }, 409: { description: 'Email sudah terdaftar' } },
      },
    },
    '/api/auth/login': {
      post: {
        summary: 'Login User',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'petani@jadipetani.com' },
                  password: { type: 'string', example: 'farmer123' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Login berhasil, JWT Access Token & HttpOnly Refresh Cookie diberikan' } },
      },
    },
    '/api/auth/me': {
      get: {
        summary: 'Get Current Authenticated User',
        tags: ['Authentication'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Data user login' } },
      },
    },
    '/api/auth/refresh-token': {
      post: {
        summary: 'Refresh Access Token Baru',
        tags: ['Authentication'],
        responses: { 200: { description: 'Access Token baru diterbitkan' } },
      },
    },
    '/api/auth/logout': {
      post: {
        summary: 'Logout User (Hapus Cookie Refresh Token)',
        tags: ['Authentication'],
        responses: { 200: { description: 'Logout berhasil' } },
      },
    },
    '/api/auth/forgot-password': {
      post: {
        summary: 'Kirim Email Reset Password (via Resend)',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string', example: 'user@jadipetani.com' } } } } },
        },
        responses: { 200: { description: 'Email reset password terkirim' } },
      },
    },
    '/api/auth/reset-password': {
      post: {
        summary: 'Reset Password dengan Token Email',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { token: { type: 'string' }, newPassword: { type: 'string' } } } } },
        },
        responses: { 200: { description: 'Password berhasil diubah' } },
      },
    },

    // 4. User Profile
    '/api/users/profile': {
      get: {
        summary: 'Get Data Profil',
        tags: ['User Profile'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Data profil user' } },
      },
      put: {
        summary: 'Update Data Profil',
        tags: ['User Profile'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  phone: { type: 'string', example: '081234567890' },
                  address: { type: 'string', example: 'Lembang, Bandung' },
                  institution: { type: 'string', example: 'IPB University' },
                  bio: { type: 'string', example: 'Pegiat pertanian modern' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Profil berhasil diperbarui' } },
      },
    },
    '/api/users/profile/completion': {
      get: {
        summary: 'Hitung Persentase Kelengkapan Profil (0-100%)',
        tags: ['User Profile'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Statistik kelengkapan profil' } },
      },
    },
    '/api/users/profile/avatar': {
      post: {
        summary: 'Upload Foto Profil (Supabase Storage)',
        tags: ['User Profile'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Avatar berhasil diupload' } },
      },
    },
    '/api/users/change-password': {
      put: {
        summary: 'Ganti Password User',
        tags: ['User Profile'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Password berhasil diperbarui' } },
      },
    },
    '/api/users/me': {
      delete: {
        summary: 'Hapus Akun User',
        tags: ['User Profile'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Akun berhasil dihapus' } },
      },
    },

    // 5. Internships
    '/api/internships': {
      get: {
        summary: 'List Lowongan Magang Publik (Search & Filter)',
        tags: ['Internships'],
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'location', in: 'query', schema: { type: 'string' } },
          { name: 'commodity', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: { 200: { description: 'Daftar lowongan magang aktif' } },
      },
      post: {
        summary: 'Buat Lowongan Magang Baru (Petani)',
        tags: ['Internships'],
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Draft lowongan magang dibuat' } },
      },
    },
    '/api/internships/my': {
      get: {
        summary: 'List Lowongan Magang Milik Petani Login',
        tags: ['Internships'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Daftar lowongan magang milik petani' } },
      },
    },
    '/api/internships/{id}': {
      get: {
        summary: 'Detail Lowongan Magang',
        tags: ['Internships'],
        responses: { 200: { description: 'Detail lowongan magang' } },
      },
      put: {
        summary: 'Edit Lowongan Magang',
        tags: ['Internships'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Lowongan magang diperbarui' } },
      },
      delete: {
        summary: 'Hapus Lowongan Magang',
        tags: ['Internships'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Lowongan magang dihapus' } },
      },
    },
    '/api/internships/{id}/publish': {
      patch: {
        summary: 'Publikasikan Lowongan Magang (Draft -> Active)',
        tags: ['Internships'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Lowongan magang dipublikasikan' } },
      },
    },

    // 6. AI Curriculum
    '/api/internships/{id}/curriculum/generate': {
      post: {
        summary: 'Generate Kurikulum AI Mingguan (Gemini API)',
        tags: ['AI Curriculum'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Kurikulum hasil AI berhasil digenerate' } },
      },
    },
    '/api/internships/{id}/curriculum': {
      get: {
        summary: 'Preview Kurikulum Lowongan Magang',
        tags: ['AI Curriculum'],
        responses: { 200: { description: 'Daftar minggu & aktivitas kurikulum' } },
      },
      put: {
        summary: 'Simpan / Edit Manual Kurikulum Mingguan',
        tags: ['AI Curriculum'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Kurikulum berhasil disimpan' } },
      },
      delete: {
        summary: 'Reset / Hapus Kurikulum',
        tags: ['AI Curriculum'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Kurikulum berhasil dihapus' } },
      },
    },

    // 7. Applications & Applicant Management
    '/api/internships/{id}/apply': {
      post: {
        summary: 'Apply Lowongan Magang (Upload CV & Portfolio PDF)',
        tags: ['Applications'],
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Lamaran magang berhasil dikirim' } },
      },
    },
    '/api/jobs/{id}/apply': {
      post: {
        summary: 'Apply Lowongan Kerja Job Connector',
        tags: ['Applications'],
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Lamaran kerja berhasil dikirim' } },
      },
    },
    '/api/applications/my': {
      get: {
        summary: 'List Seluruh Lamaran Milik Pelajar Login',
        tags: ['Applications'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Daftar lamaran pelajar' } },
      },
    },
    '/api/applications/{id}': {
      get: {
        summary: 'Detail Lamaran (CV & Portfolio Signed URLs)',
        tags: ['Applications'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Detail data lamaran' } },
      },
      delete: {
        summary: 'Hapus / Batal Lamaran (Status REVIEW)',
        tags: ['Applications'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Lamaran berhasil dihapus' } },
      },
    },
    '/api/internships/{id}/applicants': {
      get: {
        summary: 'List Pendaftar Magang untuk Petani',
        tags: ['Applicant Management'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Daftar pelamar magang' } },
      },
    },
    '/api/jobs/{id}/applicants': {
      get: {
        summary: 'List Pendaftar Job Connector untuk Petani',
        tags: ['Applicant Management'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Daftar pelamar pekerjaan' } },
      },
    },
    '/api/applications/{id}/accept': {
      patch: {
        summary: 'Terima Pelamar (Enforce Quota & Auto Create Logbook)',
        tags: ['Applicant Management'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Pelamar diterima & logbook terbuat' } },
      },
    },
    '/api/applications/{id}/reject': {
      patch: {
        summary: 'Tolak Pelamar (Send Rejection Email)',
        tags: ['Applicant Management'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Pelamar ditolak' } },
      },
    },

    // 8. My Internships & AI Logbook
    '/api/my-internships': {
      get: {
        summary: 'List Program Magang Aktif & Lulus Pelajar',
        tags: ['My Internships & AI Logbook'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Daftar program magang yang diikuti' } },
      },
    },
    '/api/my-internships/{id}/logbook': {
      get: {
        summary: 'Data Logbook Mingguan & Progress Peserta',
        tags: ['My Internships & AI Logbook'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Logbook mingguan & persentase progress' } },
      },
    },
    '/api/my-internships/{id}/logbook/week/{weekNumber}': {
      put: {
        summary: 'Update Checklist & Refleksi Minggu Tertentu',
        tags: ['My Internships & AI Logbook'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Progress minggu ini berhasil disimpan' } },
      },
    },
    '/api/my-internships/{id}/logbook/week/{weekNumber}/evidence': {
      post: {
        summary: 'Upload Bukti Dokumentasi Kegiatan Foto ke Supabase',
        tags: ['My Internships & AI Logbook'],
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Foto bukti kegiatan berhasil diupload' } },
      },
    },

    // 9. Evaluation & Certificate
    '/api/internships/{internshipId}/evaluations/{applicantId}': {
      get: {
        summary: 'Get Data Tabel Evaluasi Peserta Per Minggu',
        tags: ['Evaluation & Certificate'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Data evaluasi peserta' } },
      },
    },
    '/api/evaluations/{id}/grade': {
      patch: {
        summary: 'Simpan Skor & Catatan Evaluasi Minggu Tertentu',
        tags: ['Evaluation & Certificate'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Penilaian minggu ini disimpan' } },
      },
    },
    '/api/internships/{internshipId}/evaluations/{applicantId}/ai-summary': {
      post: {
        summary: 'Generate Ringkasan Evaluasi AI via Gemini',
        tags: ['Evaluation & Certificate'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Ringkasan AI berhasil dibuat' } },
      },
    },
    '/api/internships/{internshipId}/evaluations/{applicantId}/graduate': {
      post: {
        summary: 'Luluskan Peserta & Generate PDF Sertifikat Digital',
        tags: ['Evaluation & Certificate'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Peserta lulus & sertifikat PDF terbit' } },
      },
    },

    // 10. Certificates
    '/api/certificates/my': {
      get: {
        summary: 'List Sertifikat Milik Pelajar',
        tags: ['Certificates'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Daftar sertifikat kelulusan' } },
      },
    },
    '/api/certificates/{id}': {
      get: {
        summary: 'Detail Sertifikat Digital',
        tags: ['Certificates'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Detail data sertifikat' } },
      },
      delete: {
        summary: 'Cabut / Hapus Sertifikat',
        tags: ['Certificates'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Sertifikat berhasil dihapus' } },
      },
    },
    '/api/certificates/{id}/download': {
      get: {
        summary: 'Download File PDF Sertifikat',
        tags: ['Certificates'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Redirect ke URL Supabase PDF' } },
      },
    },

    // 11. Job Connector
    '/api/jobs': {
      get: {
        summary: 'List Lowongan Kerja Published (Publik)',
        tags: ['Job Connector'],
        responses: { 200: { description: 'List lowongan kerja' } },
      },
      post: {
        summary: 'Buat Lowongan Kerja + Midtrans Snap Token (Hitung 50% Placement Fee)',
        tags: ['Job Connector'],
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Lowongan dibuat & snapToken dikembalikan' } },
      },
    },
    '/api/jobs/my': {
      get: {
        summary: 'List Lowongan Kerja Milik Petani Login',
        tags: ['Job Connector'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Daftar lowongan kerja petani' } },
      },
    },
    '/api/jobs/{id}': {
      get: {
        summary: 'Detail Lowongan Kerja',
        tags: ['Job Connector'],
        responses: { 200: { description: 'Detail lowongan kerja' } },
      },
      put: {
        summary: 'Edit Lowongan Kerja',
        tags: ['Job Connector'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Lowongan kerja diperbarui' } },
      },
      delete: {
        summary: 'Hapus Lowongan Kerja',
        tags: ['Job Connector'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Lowongan kerja dihapus' } },
      },
    },
    '/api/jobs/{id}/close': {
      patch: {
        summary: 'Tutup Lowongan Kerja Manual',
        tags: ['Job Connector'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Lowongan kerja ditutup' } },
      },
    },
    '/api/jobs/{id}/retry-payment': {
      post: {
        summary: 'Generate Ulang Token Pembayaran Midtrans',
        tags: ['Job Connector'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Token pembayaran baru dikembalikan' } },
      },
    },
    '/api/jobs/{id}/payment-status': {
      get: {
        summary: 'Cek Status Transaksi Langsung ke Midtrans API (Reconciliation)',
        tags: ['Job Connector'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Status transaksi terkini dari Midtrans' } },
      },
    },

    // 12. Payments
    '/api/payments/midtrans/callback': {
      post: {
        summary: 'Webhook Midtrans Snap Callback (SHA-512 Verification & Idempotent)',
        tags: ['Payments'],
        responses: { 200: { description: 'Notification processed successfully' } },
      },
    },

    // 13. Bookmarks
    '/api/bookmarks': {
      post: {
        summary: 'Simpan / Bookmark Lowongan (Magang / Pekerjaan)',
        tags: ['Bookmarks'],
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Lowongan di-bookmark' } },
      },
    },
    '/api/bookmarks/my': {
      get: {
        summary: 'List Bookmark Milik Pelajar Login',
        tags: ['Bookmarks'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Daftar bookmark lowongan' } },
      },
    },
    '/api/bookmarks/{id}': {
      delete: {
        summary: 'Hapus Bookmark',
        tags: ['Bookmarks'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Bookmark dihapus' } },
      },
    },

    // 14. Dashboard
    '/api/dashboard/farmer': {
      get: {
        summary: 'Statistik Dashboard Petani',
        tags: ['Dashboard'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Summary statistik petani' } },
      },
    },
    '/api/dashboard/student': {
      get: {
        summary: 'Statistik Dashboard Pelajar',
        tags: ['Dashboard'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Summary statistik pelajar' } },
      },
    },
  },
};

module.exports = openApiSpec;
