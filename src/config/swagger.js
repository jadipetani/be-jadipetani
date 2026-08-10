const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: '🌾 Jadipetani Backend API Reference',
    version: '1.0.0',
    description: `
# 🚀 Panduan Lengkap Uji Coba API Jadipetani (Untuk Pemula & FE Developer)

Selamat datang di Dokumentasi Interaktif API Backend **Jadipetani**! Halaman ini memungkinkan Anda untuk langsung menguji (testing) seluruh 51 endpoint REST API langsung dari browser tanpa perlu menginstall Postman.

---

## 🔐 Cara Melakukan Otentikasi (Login & Token JWT)
1. Pergi ke seksi **Authentication** → pilih \`POST /api/auth/login\`.
2. Klik tombol **"Test Request"** / **"Try It Out"**.
3. Gunakan akun demo berikut atau daftarkan akun baru via \`POST /api/auth/register\`:
   - **Petani (Farmer)**: \`petani@jadipetani.com\` | Password: \`farmer123\`
   - **Pelajar (Student)**: \`pelajar@jadipetani.com\` | Password: \`student123\`
4. Setelah respon **200 OK** muncul, salin nilai \`accessToken\` yang dikembalikan.
5. Gulir ke bagian atas halaman ini, klik tombol **"Authorize"** / **"Bearer Auth"**, lalu tempelkan (paste) \`accessToken\` Anda.
6. Sekarang Anda bisa mengakses seluruh endpoint privat yang membutuhkan autentikasi!

---

## 🧭 Alur Skenario Pengujian (End-to-End Testing Flow)

### 1️⃣ Skenario Magang Pertanian (Internship Flow)
1. **[Petani] Buat Lowongan Magang**: Call \`POST /api/internships\` (Status awal: \`DRAFT\`).
2. **[Petani] AI Generator Kurikulum**: Call \`POST /api/internships/{id}/curriculum/generate\` (Google Gemini AI akan otomatis menyusun modul & checklist mingguan).
3. **[Petani] Publikasikan Magang**: Call \`PATCH /api/internships/{id}/publish\` (Status berubah menjadi \`ACTIVE\`).
4. **[Pelajar] Cari & Detail Magang**: Call \`GET /api/internships\` dan \`GET /api/internships/{id}\`.
5. **[Pelajar] Melamar Magang**: Call \`POST /api/internships/{id}/apply\` dengan mengunggah file CV PDF.
6. **[Petani] Lihat Pelamar**: Call \`GET /api/internships/{id}/applicants\`.
7. **[Petani] Terima Pelamar**: Call \`PATCH /api/applications/{id}/accept\` (Sistem otomatis memeriksa kuota & memicu pembuatan **AI Logbook Mingguan**).

### 2️⃣ Skenario AI Logbook & Evaluasi Kelulusan
1. **[Pelajar] Pengisian Logbook**: Call \`GET /api/my-internships/{id}/logbook\` → centang aktivitas & isi refleksi via \`PUT /api/my-internships/{id}/logbook/week/{weekNumber}\`.
2. **[Pelajar] Upload Foto Bukti**: Call \`POST /api/my-internships/{id}/logbook/week/{weekNumber}/evidence\` (Mengunggah foto kegiatan ke Supabase Storage).
3. **[Petani] Penilaian Mingguan**: Call \`PATCH /api/evaluations/{id}/grade\` untuk memberikan skor & catatan.
4. **[Petani] Ringkasan AI**: Call \`POST /api/internships/{internshipId}/evaluations/{applicantId}/ai-summary\` (Gemini AI meringkas kekuatan & area pengembangan peserta).
5. **[Petani] Luluskan & Cetak Sertifikat**: Call \`POST /api/internships/{internshipId}/evaluations/{applicantId}/graduate\` (Terbit sertifikat digital PDF dengan nomor lisensi resmi).

### 3️⃣ Skenario Job Connector & Pembayaran Midtrans Snap
1. **[Petani] Buat Lowongan Kerja**: Call \`POST /api/jobs\` (Sistem otomatis menghitung Placement Fee 50% & mengembalikan \`snapToken\` Midtrans).
2. **[Petani] Testing Webhook Callback**: Call \`POST /api/payments/midtrans/callback\` (Mengirim event \`settlement\` untuk mengaktifkan lowongan dari \`UNPAID\` → \`PUBLISHED\`).
3. **[Pelajar] Melamar Pekerjaan**: Call \`POST /api/jobs/{id}/apply\`.
    `,
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
        description: 'Tempelkan Access Token JWT di sini (didapat dari respon login /api/auth/login)',
      },
    },
  },
  tags: [
    { name: 'Health', description: 'Monitoring Kesehatan Server' },
    { name: 'Landing', description: 'Statistik Agregat Platform (Publik)' },
    { name: 'Authentication', description: 'Registrasi, Login, Refresh Token JWT, & Reset Password' },
    { name: 'User Profile', description: 'Manajemen Profil, Upload Avatar, Ganti Password, & Kelengkapan Profil' },
    { name: 'Internships', description: 'Manajemen Lowongan Magang Pertanian (Draft, Active, Publish, Edit, Delete)' },
    { name: 'AI Curriculum', description: 'Generasi Kurikulum AI Google Gemini & Manajemen Modul Mingguan' },
    { name: 'Applications', description: 'Pengajuan Lamaran Magang & Pekerjaan Profesional' },
    { name: 'Applicant Management', description: 'Seleksi & Manajemen Pelamar oleh Petani (Terima/Tolak & Kuota)' },
    { name: 'My Internships & AI Logbook', description: 'Logbook Mingguan Peserta, Checklist Otomatis, & Upload Dokumentasi' },
    { name: 'Evaluation & Certificate', description: 'Penilaian Petani, Evaluasi AI Gemini, Kelulusan, & Penerbitan Sertifikat PDF' },
    { name: 'Certificates', description: 'Detail Sertifikat Digital, Unduh File PDF, & Pencabutan Lisensi' },
    { name: 'Job Connector', description: 'Lowongan Kerja Profesional, Skema Placement Fee 50%, & Reconcile Midtrans' },
    { name: 'Payments', description: 'Webhook Callback Midtrans Snap (Verifikasi Signature SHA-512 & Idempotent)' },
    { name: 'Bookmarks', description: 'Fitur Simpan / Bookmark Lowongan Favorit Pelajar' },
    { name: 'Dashboard', description: 'Ringkasan Statistik Dashboard Petani & Pelajar' },
  ],
  paths: {
    // ============================================
    // 1. HEALTH
    // ============================================
    '/api/health': {
      get: {
        summary: 'Cek Status Server (Health Check)',
        description: 'Memeriksa apakah server backend, database PostgreSQL Supabase, dan service berjalan dengan normal.',
        tags: ['Health'],
        responses: {
          200: {
            description: 'Server aktif dan sehat',
            content: {
              'application/json': {
                example: {
                  success: true,
                  message: 'Jadipetani Backend API Server is healthy',
                  timestamp: '2026-08-10T17:30:00.000Z',
                  environment: 'production',
                },
              },
            },
          },
        },
      },
    },

    // ============================================
    // 2. LANDING
    // ============================================
    '/api/landing/stats': {
      get: {
        summary: 'Statistik Platform untuk Landing Page (Publik)',
        description: 'Mengembalikan data agregat total petani terdaftar, pelajar terdaftar, dan program magang aktif untuk ditampilkan di Landing Page utama.',
        tags: ['Landing'],
        responses: {
          200: {
            description: 'Data statistik agregat berhasil diambil',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    registeredFarmers: 120,
                    registeredStudents: 450,
                    activePrograms: 35,
                    certificatesIssued: 280,
                  },
                },
              },
            },
          },
        },
      },
    },

    // ============================================
    // 3. AUTHENTICATION
    // ============================================
    '/api/auth/register': {
      post: {
        summary: 'Registrasi Pengguna Baru',
        description: 'Mendaftarkan akun baru dengan pilihan peran **FARMER** (Petani Pemilik Kebun) atau **STUDENT** (Pelajar / Mahasiswa).',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['fullName', 'email', 'password', 'confirmPassword', 'role', 'agreedToTerms'],
                properties: {
                  fullName: { type: 'string', example: 'Ahmad Rizky Pratama' },
                  email: { type: 'string', example: 'ahmad.rizky@student.ipb.ac.id' },
                  password: { type: 'string', example: 'password123' },
                  confirmPassword: { type: 'string', example: 'password123' },
                  role: { type: 'string', enum: ['FARMER', 'STUDENT'], example: 'STUDENT' },
                  agreedToTerms: { type: 'boolean', example: true },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Registrasi berhasil',
            content: {
              'application/json': {
                example: {
                  success: true,
                  message: 'Registrasi berhasil. Silakan login.',
                  data: {
                    user: {
                      id: 'u1234567-89ab-cdef-0123-456789abcdef',
                      fullName: 'Ahmad Rizky Pratama',
                      email: 'ahmad.rizky@student.ipb.ac.id',
                      role: 'STUDENT',
                    },
                    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                  },
                },
              },
            },
          },
          409: { description: 'Email sudah terdaftar di sistem' },
          422: { description: 'Validasi form gagal (password tidak sesuai / kurang panjang)' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        summary: 'Login Pengguna',
        description: 'Autentikasi akun pengguna. Mengembalikan Access Token JWT (berlaku 1 jam) dan mengatur cookie `refreshToken` (httpOnly, 30 hari).',
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
        responses: {
          200: {
            description: 'Login berhasil',
            content: {
              'application/json': {
                example: {
                  success: true,
                  message: 'Login berhasil',
                  data: {
                    user: {
                      id: 'f8765432-10fe-dcba-9876-543210fedcba',
                      fullName: 'Pak Budi Santoso',
                      email: 'petani@jadipetani.com',
                      role: 'FARMER',
                    },
                    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                  },
                },
              },
            },
          },
          401: { description: 'Email atau password salah' },
        },
      },
    },
    '/api/auth/me': {
      get: {
        summary: 'Informasi User Login Terkini',
        description: 'Mengambil data profil singkat user yang sedang aktif berdasarkan token JWT.',
        tags: ['Authentication'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Profil berhasil diambil',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    id: 'f8765432-10fe-dcba-9876-543210fedcba',
                    fullName: 'Pak Budi Santoso',
                    email: 'petani@jadipetani.com',
                    role: 'FARMER',
                    institution: 'Kelompok Tani Hydroponic Lembang',
                  },
                },
              },
            },
          },
          401: { description: 'Token tidak ditemukan atau telah kadaluarsa' },
        },
      },
    },
    '/api/auth/refresh-token': {
      post: {
        summary: 'Menerbitkan Access Token Baru (Refresh Token)',
        description: 'Memperbarui Access Token JWT yang sudah habis masa berlakunya dengan membaca cookie `refreshToken`.',
        tags: ['Authentication'],
        responses: {
          200: {
            description: 'Access token baru berhasil diterbitkan',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: { accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                },
              },
            },
          },
          401: { description: 'Refresh token invalid atau tidak ditemukan' },
        },
      },
    },
    '/api/auth/logout': {
      post: {
        summary: 'Logout Pengguna',
        description: 'Menghapus cookie `refreshToken` dari browser.',
        tags: ['Authentication'],
        responses: {
          200: {
            description: 'Logout berhasil',
            content: {
              'application/json': {
                example: { success: true, message: 'Logout berhasil' },
              },
            },
          },
        },
      },
    },
    '/api/auth/forgot-password': {
      post: {
        summary: 'Permintaan Reset Password (Kirim Email)',
        description: 'Mengirimkan email instruksi berisi token reset password via layanan Resend.',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', example: 'user@jadipetani.com' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Email reset password telah dikirim' },
        },
      },
    },
    '/api/auth/reset-password': {
      post: {
        summary: 'Pembaruan Password Baru dengan Token Email',
        description: 'Menyetel password baru menggunakan token unik yang dikirimkan ke email user.',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token', 'newPassword'],
                properties: {
                  token: { type: 'string', example: 'c891234a-5678-90bc-def1-234567890abc' },
                  newPassword: { type: 'string', example: 'newpassword123' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Password berhasil diperbarui' },
        },
      },
    },

    // ============================================
    // 4. USER PROFILE
    // ============================================
    '/api/users/profile': {
      get: {
        summary: 'Ambil Detail Profil Lengkap',
        tags: ['User Profile'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Detail profil pengguna',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    id: 'u1234567-89ab-cdef-0123-456789abcdef',
                    fullName: 'Ahmad Rizky Pratama',
                    email: 'ahmad.rizky@student.ipb.ac.id',
                    role: 'STUDENT',
                    phone: '081234567890',
                    address: 'Jl. Raya Dramaga No. 15, Bogor',
                    institution: 'Institut Pertanian Bogor (IPB)',
                    bio: 'Mahasiswa Agroteknologi minat pada Smart Farming & Hydroponics.',
                    avatarUrl: 'https://xxx.supabase.co/storage/v1/object/public/avatars/user-avatar.jpg',
                  },
                },
              },
            },
          },
        },
      },
      put: {
        summary: 'Perbarui Data Profil Pengguna',
        tags: ['User Profile'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  phone: { type: 'string', example: '081299887766' },
                  address: { type: 'string', example: 'Lembang, Bandung Barat' },
                  institution: { type: 'string', example: 'Kelompok Tani Subur Makmur' },
                  bio: { type: 'string', example: 'Praktisi budidaya hidroponik buah & sayur komersial.' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Profil berhasil diperbarui' },
        },
      },
    },
    '/api/users/profile/completion': {
      get: {
        summary: 'Hitung Persentase Kelengkapan Profil (Progress Profil)',
        description: 'Menghitung persentase isi data profil (0-100%) untuk menampilkan bar progress dan CTA "Lengkapi Profil" di Dashboard Pelajar.',
        tags: ['User Profile'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Perhitungan persentase kelengkapan profil',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    completionPercentage: 83,
                    filledFields: 5,
                    totalFields: 6,
                    isComplete: false,
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/users/profile/avatar': {
      post: {
        summary: 'Upload Foto Profil (Supabase Storage)',
        description: 'Mengunggah file foto profil (JPG/PNG/WebP, max 5MB) ke bucket Supabase `avatars`.',
        tags: ['User Profile'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  avatar: { type: 'string', format: 'binary', description: 'File gambar (JPG, PNG, WebP)' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Foto profil berhasil diupload & disimpan' },
        },
      },
    },
    '/api/users/change-password': {
      put: {
        summary: 'Ganti Password Pengguna',
        tags: ['User Profile'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['currentPassword', 'newPassword', 'confirmNewPassword'],
                properties: {
                  currentPassword: { type: 'string', example: 'password123' },
                  newPassword: { type: 'string', example: 'newpassword123' },
                  confirmNewPassword: { type: 'string', example: 'newpassword123' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Password berhasil diubah' },
          401: { description: 'Password lama salah' },
          422: { description: 'Konfirmasi password tidak cocok / validasi gagal' },
        },
      },
    },
    '/api/users/me': {
      delete: {
        summary: 'Hapus Akun Pengguna Permanen',
        tags: ['User Profile'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Akun berhasil dihapus' },
        },
      },
    },

    // ============================================
    // 5. INTERNSHIPS
    // ============================================
    '/api/internships': {
      get: {
        summary: 'Daftar Lowongan Magang Publik (Search & Filter)',
        description: 'Menampilkan seluruh program magang berstatus `ACTIVE` yang terbuka untuk dilamar oleh pelajar.',
        tags: ['Internships'],
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Cari judul / komoditas' },
          { name: 'location', in: 'query', schema: { type: 'string' }, description: 'Filter lokasi' },
          { name: 'commodity', in: 'query', schema: { type: 'string' }, description: 'Filter jenis komoditas' },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: {
          200: {
            description: 'Daftar lowongan magang publik',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: [
                    {
                      id: 'i1234567-89ab-cdef-0123-456789abcdef',
                      title: 'Magang Budidaya Melon Hidroponik',
                      commodity: 'Melon Hibrida Super',
                      location: 'Lembang, Bandung Barat',
                      durationMonths: 1,
                      quota: 4,
                      acceptedCount: 1,
                      deadline: '2026-09-01T00:00:00.000Z',
                      status: 'ACTIVE',
                      farmer: { fullName: 'Pak Budi Santoso', institution: 'Hydroponic Lembang' },
                    },
                  ],
                  meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Buat Program Magang Baru (Petani)',
        description: 'Membuat draft lowongan magang baru. Awalnya berstatus `DRAFT` sebelum dipublikasikan.',
        tags: ['Internships'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'commodity', 'location', 'durationMonths', 'quota', 'deadline', 'description'],
                properties: {
                  title: { type: 'string', example: 'Magang Budidaya Melon Hidroponik' },
                  commodity: { type: 'string', example: 'Melon Hibrida Super' },
                  location: { type: 'string', example: 'Lembang, Bandung Barat' },
                  durationMonths: { type: 'integer', example: 1 },
                  quota: { type: 'integer', example: 4 },
                  deadline: { type: 'string', example: '2026-09-01T00:00:00.000Z' },
                  facilities: { type: 'string', example: 'Akomodasi mes, makan siang gratis, peralatan praktek' },
                  description: { type: 'string', example: 'Program magang 1 bulan mempelajari nutrisi AB Mix & drip fertigation.' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Program magang baru berhasil dibuat (Status DRAFT)' },
        },
      },
    },
    '/api/internships/my': {
      get: {
        summary: 'Daftar Lowongan Magang Milik Petani Login',
        description: 'Menampilkan seluruh lowongan magang milik petani (semua status: DRAFT, ACTIVE, CLOSED).',
        tags: ['Internships'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Daftar magang milik petani' } },
      },
    },
    '/api/internships/{id}': {
      get: {
        summary: 'Detail Program Magang',
        tags: ['Internships'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Detail lengkap program magang' } },
      },
      put: {
        summary: 'Edit Data Program Magang',
        tags: ['Internships'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string', example: 'Magang Budidaya Melon Organik' },
                  commodity: { type: 'string', example: 'Melon Organik' },
                  location: { type: 'string', example: 'Lembang Barat, Bandung' },
                  durationMonths: { type: 'integer', example: 1 },
                  quota: { type: 'integer', example: 5 },
                  status: { type: 'string', enum: ['DRAFT', 'ACTIVE', 'CLOSED'], example: 'ACTIVE' },
                  facilities: { type: 'string', example: 'Mes, makan siang, sertifikat' },
                  description: { type: 'string', example: 'Program magang 1 bulan budidaya melon.' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Program magang diperbarui' } },
      },
      delete: {
        summary: 'Hapus Program Magang',
        tags: ['Internships'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Program magang dihapus' } },
      },
    },
    '/api/internships/{id}/publish': {
      patch: {
        summary: 'Publikasikan Lowongan Magang (DRAFT -> ACTIVE)',
        tags: ['Internships'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Lowongan magang dipublikasikan' } },
      },
    },

    // ============================================
    // 6. AI CURRICULUM
    // ============================================
    '/api/internships/{id}/curriculum/generate': {
      post: {
        summary: 'Generate Kurikulum Mingguan Otomatis Menggunakan Google Gemini AI',
        description: 'Memanggil API Google Gemini AI untuk menyusun struktur modul belajar, bab, dan checklist aktivitas mingguan berdasarkan komoditas & durasi magang.',
        tags: ['AI Curriculum'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Kurikulum AI berhasil disusun',
            content: {
              'application/json': {
                example: {
                  success: true,
                  message: 'Kurikulum AI berhasil digenerate',
                  data: {
                    curriculum: [
                      {
                        weekNumber: 1,
                        title: 'Minggu 1: Persiapan Media Tanam & Persemaian Benih Melon',
                        description: 'Memahami formulasi media cocopeat & teknik semai.',
                        activities: [
                          { name: 'Sterilisasi Media Tanam', description: 'Gunakan larutan sterilisasi', weight: 40 },
                          { name: 'Penyemaian Benih di Tray', description: 'Semai 50 benih melon', weight: 60 },
                        ],
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/internships/{id}/curriculum': {
      get: {
        summary: 'Preview Kurikulum Program Magang',
        tags: ['AI Curriculum'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Struktur kurikulum mingguan' } },
      },
      put: {
        summary: 'Simpan / Edit Manual Kurikulum Mingguan',
        tags: ['AI Curriculum'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['curriculum'],
                properties: {
                  curriculum: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['weekNumber', 'title', 'description', 'activities'],
                      properties: {
                        weekNumber: { type: 'integer', example: 1 },
                        title: { type: 'string', example: 'Minggu 1: Olah Tanah' },
                        description: { type: 'string', example: 'Persiapan bedengan lahan' },
                        activities: {
                          type: 'array',
                          items: {
                            type: 'object',
                            required: ['name', 'description', 'weight'],
                            properties: {
                              name: { type: 'string', example: 'Penyangkulan' },
                              description: { type: 'string', example: 'Gemburkan tanah' },
                              weight: { type: 'integer', example: 50 },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Kurikulum berhasil disimpan' } },
      },
      delete: {
        summary: 'Reset / Hapus Kurikulum',
        tags: ['AI Curriculum'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Kurikulum berhasil dihapus' } },
      },
    },

    // ============================================
    // 7. APPLICATIONS & APPLICANTS
    // ============================================
    '/api/internships/{id}/apply': {
      post: {
        summary: 'Kirim Lamaran Magang (Pelajar)',
        description: 'Pelajar mengirimkan lamaran dengan mengunggah file CV (Wajib PDF) & Portofolio (Opsional PDF) yang akan disimpan aman di Supabase Storage.',
        tags: ['Applications'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['cv'],
                properties: {
                  cv: { type: 'string', format: 'binary', description: 'File CV format PDF (max 5MB)' },
                  portfolio: { type: 'string', format: 'binary', description: 'File Portfolio format PDF (max 5MB)' },
                  motivation: { type: 'string', example: 'Saya sangat tertarik belajar teknologi Drip Fertigation langsung di kebun.' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Lamaran magang berhasil dikirim' },
          400: { description: 'Kuota penuh / Anda sudah melamar sebelumnya / batas 5 lamaran aktif tercapai' },
        },
      },
    },
    '/api/jobs/{id}/apply': {
      post: {
        summary: 'Kirim Lamaran Pekerjaan Job Connector (Pelajar)',
        tags: ['Applications'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['cv'],
                properties: {
                  cv: { type: 'string', format: 'binary', description: 'File CV PDF (max 5MB)' },
                  portfolio: { type: 'string', format: 'binary', description: 'File Portfolio PDF (max 5MB)' },
                  motivation: { type: 'string', example: 'Pengalaman 2 tahun mengelola kebun hortikultura.' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Lamaran pekerjaan berhasil dikirim' } },
      },
    },
    '/api/applications/my': {
      get: {
        summary: 'List Seluruh Lamaran Milik Pelajar Login',
        description: 'Menampilkan riwayat lamaran magang & pekerjaan milik pelajar beserta statusnya (REVIEW, ACCEPTED, REJECTED, CANCELLED).',
        tags: ['Applications'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Daftar lamaran milik pelajar' } },
      },
    },
    '/api/applications/{id}': {
      get: {
        summary: 'Detail Lamaran (Termasuk Temporary Signed URL File CV & Portfolio)',
        tags: ['Applications'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Detail lamaran & signed link CV' } },
      },
      delete: {
        summary: 'Hapus / Batal Lamaran (Status REVIEW)',
        tags: ['Applications'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Lamaran berhasil dibatalkan/dihapus' } },
      },
    },
    '/api/internships/{id}/applicants': {
      get: {
        summary: 'Daftar Pelamar Program Magang (Petani)',
        tags: ['Applicant Management'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Daftar pelamar magang' } },
      },
    },
    '/api/jobs/{id}/applicants': {
      get: {
        summary: 'Daftar Pelamar Pekerjaan Job Connector (Petani)',
        tags: ['Applicant Management'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Daftar pelamar pekerjaan' } },
      },
    },
    '/api/applications/{id}/accept': {
      patch: {
        summary: 'Terima Pelamar Magang (Sistem Memeriksa Kuota & Membuat AI Logbook)',
        description: 'Menerima pendaftar magang. Sistem akan secara otomatis menggenerate **AI Logbook Mingguan** & tabel **Evaluasi** peserta dari kurikulum magang.',
        tags: ['Applicant Management'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Pelamar diterima & logbook peserta berhasil di-generate' } },
      },
    },
    '/api/applications/{id}/reject': {
      patch: {
        summary: 'Tolak Pelamar Magang',
        tags: ['Applicant Management'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Pelamar ditolak & email pemberitahuan dikirim' } },
      },
    },

    // ============================================
    // 8. MY INTERNSHIPS & AI LOGBOOK
    // ============================================
    '/api/my-internships': {
      get: {
        summary: 'Daftar Program Magang yang Sedang / Pernah Diikuti Pelajar',
        tags: ['My Internships & AI Logbook'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Daftar magang peserta' } },
      },
    },
    '/api/my-internships/{id}/logbook': {
      get: {
        summary: 'Data Logbook Mingguan & Persentase Total Progress',
        tags: ['My Internships & AI Logbook'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Logbook mingguan & persentase progress' } },
      },
    },
    '/api/my-internships/{id}/logbook/week/{weekNumber}': {
      put: {
        summary: 'Update Checklist & Refleksi Mingguan (Peserta Magang)',
        description: 'Peserta menyentang aktivitas yang selesai dikerjakan & mengisi jurnal refleksi mingguan.',
        tags: ['My Internships & AI Logbook'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'weekNumber', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  reflection: { type: 'string', example: 'Minggu ini berhasil menyemai 50 benih melon dengan persentase tumbuh 95%.' },
                  activities: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        isCompleted: { type: 'boolean', example: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Progress logbook minggu ini disimpan' } },
      },
    },
    '/api/my-internships/{id}/logbook/week/{weekNumber}/evidence': {
      post: {
        summary: 'Upload Foto Bukti Kegiatan Minggu Ini (Supabase Storage)',
        description: 'Mengunggah foto-foto dokumentasi bukti kegiatan praktek mingguan ke bucket Supabase `logbook-docs`.',
        tags: ['My Internships & AI Logbook'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'weekNumber', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  documentation: { type: 'array', items: { type: 'string', format: 'binary' }, description: 'File gambar (JPG, PNG, max 10 file)' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Foto bukti dokumentasi berhasil diunggah' } },
      },
    },

    // ============================================
    // 9. EVALUATION & CERTIFICATE
    // ============================================
    '/api/internships/{internshipId}/evaluations/{applicantId}': {
      get: {
        summary: 'Get Data Lembar Evaluasi Peserta (Petani)',
        tags: ['Evaluation & Certificate'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'internshipId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'applicantId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Data evaluasi peserta' } },
      },
    },
    '/api/evaluations/{id}/grade': {
      patch: {
        summary: 'Berikan Skor Penilaian & Catatan Petani',
        tags: ['Evaluation & Certificate'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['score'],
                properties: {
                  score: { type: 'integer', example: 90, description: 'Skor 0-100' },
                  notes: { type: 'string', example: 'Sangat teliti dalam sterilisasi media tanam.' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Nilai minggu ini berhasil disimpan' } },
      },
    },
    '/api/internships/{internshipId}/evaluations/{applicantId}/ai-summary': {
      post: {
        summary: 'Generate Ringkasan Evaluasi AI Gemini',
        description: 'Google Gemini AI menganalisis seluruh data checklist & refleksi logbook peserta untuk menghasilkan **Kompetensi Utama** & **Rekomendasi Area Pengembangan**.',
        tags: ['Evaluation & Certificate'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'internshipId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'applicantId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Ringkasan AI berhasil di-generate' } },
      },
    },
    '/api/internships/{internshipId}/evaluations/{applicantId}/graduate': {
      post: {
        summary: 'Luluskan Peserta & Terbitkan Sertifikat Digital PDF',
        description: 'Petani meluluskan peserta. Sistem akan secara otomatis menggenerate file PDF Sertifikat Lanskap menggunakan PDFKit dengan nomor lisensi unik `JP-CERT-YYYY-XXXX`, mengunggah ke Supabase Storage, dan mengelolanya.',
        tags: ['Evaluation & Certificate'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'internshipId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'applicantId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Peserta dinyatakan LULUS & sertifikat PDF berhasil terbit' } },
      },
    },

    // ============================================
    // 10. CERTIFICATES
    // ============================================
    '/api/certificates/my': {
      get: {
        summary: 'Daftar Sertifikat Kelulusan Milik Pelajar',
        tags: ['Certificates'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Daftar sertifikat milik pelajar' } },
      },
    },
    '/api/certificates/{id}': {
      get: {
        summary: 'Detail Data Sertifikat Digital',
        tags: ['Certificates'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Detail sertifikat' } },
      },
      delete: {
        summary: 'Cabut / Hapus Sertifikat',
        tags: ['Certificates'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Sertifikat dihapus' } },
      },
    },
    '/api/certificates/{id}/download': {
      get: {
        summary: 'Download File PDF Sertifikat',
        tags: ['Certificates'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 302: { description: 'Redirect langsung ke Public URL Supabase PDF' } },
      },
    },

    // ============================================
    // 11. JOB CONNECTOR & PAYMENTS
    // ============================================
    '/api/jobs': {
      get: {
        summary: 'Daftar Lowongan Kerja Profesional Published (Publik)',
        tags: ['Job Connector'],
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'location', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: { 200: { description: 'Daftar lowongan kerja profesional' } },
      },
      post: {
        summary: 'Buat Lowongan Kerja + Generate Payment Token Midtrans Snap',
        description: 'Petani membuat lowongan pekerjaan. Sistem otomatis menghitung **Placement Fee 50%** dari gaji tawaran dan mengembalikan token pembayaran Midtrans Snap (\`snapToken\`). Status awal: \`UNPAID\`.',
        tags: ['Job Connector'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'location', 'description', 'qualifications', 'offeredSalary'],
                properties: {
                  title: { type: 'string', example: 'Manajer Kebun Kelapa Sawit' },
                  location: { type: 'string', example: 'Pekanbaru, Riau' },
                  description: { type: 'string', example: 'Mengawasi operasional kebun sawit komersial 500 hektar.' },
                  qualifications: { type: 'string', example: 'S1 Pertanian, pengalaman lapangan minimal 3 tahun.' },
                  offeredSalary: { type: 'integer', example: 8000000, description: 'Gaji bulanan Rp (Placement fee otomatis 50% = Rp 4.000.000)' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Lowongan dibuat & Midtrans Snap Token dihasilkan',
            content: {
              'application/json': {
                example: {
                  success: true,
                  message: 'Lowongan kerja berhasil dibuat. Silakan selesaikan pembayaran placement fee.',
                  data: {
                    job: {
                      id: 'j1234567-89ab-cdef-0123-456789abcdef',
                      title: 'Manajer Kebun Kelapa Sawit',
                      offeredSalary: 8000000,
                      placementFee: 4000000,
                      status: 'UNPAID',
                    },
                    snapToken: 'snap-token-midtrans-12345',
                    orderId: 'JOB-FEE-1723456789-0123',
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/jobs/my': {
      get: {
        summary: 'Daftar Lowongan Kerja Milik Petani Login',
        tags: ['Job Connector'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'List lowongan kerja petani' } },
      },
    },
    '/api/jobs/{id}': {
      get: {
        summary: 'Detail Lowongan Kerja',
        tags: ['Job Connector'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Detail lowongan kerja' } },
      },
      put: {
        summary: 'Edit Lowongan Kerja',
        tags: ['Job Connector'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Lowongan kerja diperbarui' } },
      },
      delete: {
        summary: 'Hapus Lowongan Kerja',
        tags: ['Job Connector'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Lowongan kerja dihapus' } },
      },
    },
    '/api/jobs/{id}/close': {
      patch: {
        summary: 'Tutup Lowongan Kerja Manual',
        tags: ['Job Connector'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Lowongan kerja ditutup' } },
      },
    },
    '/api/jobs/{id}/retry-payment': {
      post: {
        summary: 'Buat Ulang Token Pembayaran Midtrans (Retry Payment)',
        tags: ['Job Connector'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Snap token baru berhasil dibuat' } },
      },
    },
    '/api/jobs/{id}/payment-status': {
      get: {
        summary: 'Cek Status Transaksi Langsung ke Midtrans API (Reconciliation)',
        tags: ['Job Connector'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Status terkini transaksi dari Midtrans' } },
      },
    },
    '/api/payments/midtrans/callback': {
      post: {
        summary: 'Webhook Notification Callback dari Server Midtrans',
        description: 'Endpoint ini dipanggil otomatis oleh server Midtrans saat transaksi berubah status (`settlement`, `expire`, `deny`). Memverifikasi **SHA-512 Signature Key** & dijamin **idempotent**.',
        tags: ['Payments'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  order_id: { type: 'string', example: 'JOB-FEE-1723456789-0123' },
                  status_code: { type: 'string', example: '200' },
                  gross_amount: { type: 'string', example: '4000000.00' },
                  signature_key: { type: 'string', example: 'sha512-hash-key...' },
                  transaction_status: { type: 'string', example: 'settlement' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Callback berhasil diproses' } },
      },
    },

    // ============================================
    // 12. BOOKMARKS
    // ============================================
    '/api/bookmarks': {
      post: {
        summary: 'Simpan / Bookmark Lowongan (Magang atau Pekerjaan)',
        tags: ['Bookmarks'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  internshipId: { type: 'string', example: 'i1234567-89ab-cdef-0123-456789abcdef' },
                  jobId: { type: 'string', example: 'j1234567-89ab-cdef-0123-456789abcdef' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Lowongan berhasil di-bookmark' } },
      },
    },
    '/api/bookmarks/my': {
      get: {
        summary: 'Daftar Bookmark Milik Pelajar Login',
        tags: ['Bookmarks'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Daftar bookmark pelajar' } },
      },
    },
    '/api/bookmarks/{id}': {
      delete: {
        summary: 'Hapus Bookmark',
        tags: ['Bookmarks'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Bookmark berhasil dihapus' } },
      },
    },

    // ============================================
    // 13. DASHBOARD
    // ============================================
    '/api/dashboard/farmer': {
      get: {
        summary: 'Statistik Ringkasan Dashboard Petani',
        tags: ['Dashboard'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Statistik dashboard petani',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    activeListings: 4,
                    newApplicants: 12,
                    activeInterns: 5,
                    certificatesIssued: 18,
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/dashboard/student': {
      get: {
        summary: 'Statistik Ringkasan Dashboard Pelajar',
        tags: ['Dashboard'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Statistik dashboard pelajar',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    activeApplications: 2,
                    enrolledPrograms: 1,
                    completedChecklists: 12,
                    certificatesEarned: 1,
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

module.exports = openApiSpec;
