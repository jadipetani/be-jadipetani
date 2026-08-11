const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: '🌾 Jadipetani Backend API Reference',
    version: '1.0.0',
    description: `
# 🚀 Panduan Lengkap Uji Coba API Jadipetani (Untuk Pemula & FE Developer)

Selamat datang di Dokumentasi Interaktif API Backend **Jadipetani**! Halaman ini memungkinkan Anda untuk langsung menguji (*testing*) seluruh 51+ endpoint REST API langsung dari browser tanpa perlu menginstall Postman.

---

## 🔐 Cara Melakukan Otentikasi (Login & Token JWT)
1. Pergi ke seksi **Authentication** → pilih \`POST /api/auth/login\`.
2. Klik tombol **"Test Request"** / **"Try It Out"**.
3. Gunakan akun demo berikut atau daftarkan akun baru via \`POST /api/auth/register\`:
   - **Petani (Farmer)**: \`petani@jadipetani.com\` | Password: \`farmer123\`
   - **Pelajar (Student)**: \`pelajar@jadipetani.com\` | Password: \`student123\`
4. Setelah respon **200 OK** muncul, salin nilai \`accessToken\` yang dikembalikan.
5. Gulir ke bagian atas halaman ini, klik tombol **"Authorize"** / **"Bearer Auth"**, lalu tempelkan (*paste*) \`accessToken\` Anda.
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
        description: 'Masukkan Access Token JWT di sini (didapat dari respon login /api/auth/login)',
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
        description: 'Memeriksa status kesehatan server backend Express.js, koneksi database PostgreSQL Supabase, dan lingkungan aplikasi.',
        tags: ['Health'],
        responses: {
          200: {
            description: 'Server berjalan normal dan sehat',
            content: {
              'application/json': {
                example: {
                  success: true,
                  message: 'Jadipetani Backend API Server is healthy',
                  timestamp: '2026-08-11T10:00:00.000Z',
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
        summary: 'Statistik Agregat Platform untuk Landing Page (Publik)',
        description: 'Mengembalikan data statistik publik real-time seperti total petani terdaftar, pelajar aktif, program magang, dan sertifikat yang telah terbit untuk bagian hero Landing Page.',
        tags: ['Landing'],
        responses: {
          200: {
            description: 'Data statistik platform berhasil diambil',
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
        summary: 'Registrasi Akun Pengguna Baru',
        description: 'Mendaftarkan akun baru dengan memilih peran **FARMER** (Petani/Pemilik Lahan/Perusahaan) atau **STUDENT** (Pelajar/Mahasiswa/Pemuda).',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['fullName', 'email', 'password', 'confirmPassword', 'role', 'agreedToTerms'],
                properties: {
                  fullName: { type: 'string', description: 'Nama lengkap pengguna (2-100 karakter)', example: 'Ahmad Rizky Pratama' },
                  email: { type: 'string', format: 'email', description: 'Email unik aktif', example: 'ahmad.rizky@student.ipb.ac.id' },
                  password: { type: 'string', format: 'password', description: 'Password akun (minimal 8 karakter)', example: 'password123' },
                  confirmPassword: { type: 'string', format: 'password', description: 'Konfirmasi password (harus sama dengan password)', example: 'password123' },
                  role: { type: 'string', enum: ['FARMER', 'STUDENT'], description: 'Peran akun pengguna', example: 'STUDENT' },
                  agreedToTerms: { type: 'boolean', description: 'Persetujuan syarat dan ketentuan (harus true)', example: true },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Registrasi akun berhasil',
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
                      createdAt: '2026-08-11T10:00:00.000Z',
                    },
                    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                  },
                },
              },
            },
          },
          409: { description: 'Email sudah terdaftar di sistem' },
          422: { description: 'Validasi input gagal (password terlalu pendek / tidak cocok / agreedToTerms false)' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        summary: 'Login Pengguna & Terbitkan JWT Access Token',
        description: 'Autentikasi akun pengguna. Mengembalikan `accessToken` JWT (berlaku 1 jam) dan mengatur cookie `refreshToken` httpOnly (berlaku 30 hari).',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', description: 'Email terdaftar', example: 'pelajar@jadipetani.com' },
                  password: { type: 'string', format: 'password', description: 'Password akun', example: 'student123' },
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
                      id: 'u1234567-89ab-cdef-0123-456789abcdef',
                      fullName: 'Siti Rahmawati',
                      email: 'pelajar@jadipetani.com',
                      role: 'STUDENT',
                      avatarUrl: 'https://xxx.supabase.co/storage/v1/object/public/avatars/user-123.jpg',
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
        summary: 'Ambil Profil Pengguna yang Sedang Login',
        description: 'Mengembalikan informasi detail akun pengguna yang sedang terotentikasi berdasarkan JWT Bearer token.',
        tags: ['Authentication'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Profil pengguna berhasil diambil',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    id: 'u1234567-89ab-cdef-0123-456789abcdef',
                    fullName: 'Siti Rahmawati',
                    email: 'pelajar@jadipetani.com',
                    role: 'STUDENT',
                    phone: '081234567890',
                    address: 'Bogor, Jawa Barat',
                    institution: 'Institut Pertanian Bogor',
                    bio: 'Mahasiswa Agroteknologi minat hidroponik & smart farming.',
                    avatarUrl: 'https://xxx.supabase.co/storage/v1/object/public/avatars/user-123.jpg',
                    createdAt: '2026-08-11T10:00:00.000Z',
                  },
                },
              },
            },
          },
          401: { description: 'Token tidak ditemukan / expired / invalid' },
        },
      },
    },
    '/api/auth/refresh-token': {
      post: {
        summary: 'Refresh Access Token Menggunakan Cookie Refresh Token',
        description: 'Menerbitkan `accessToken` baru tanpa perlu login ulang dengan membaca cookie httpOnly `refreshToken`.',
        tags: ['Authentication'],
        responses: {
          200: {
            description: 'Access token berhasil diperbarui',
            content: {
              'application/json': {
                example: {
                  success: true,
                  message: 'Token diperbarui',
                  data: {
                    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                  },
                },
              },
            },
          },
          401: { description: 'Refresh token tidak valid atau telah kedaluwarsa' },
        },
      },
    },
    '/api/auth/logout': {
      post: {
        summary: 'Logout Pengguna & Hapus Cookie Refresh Token',
        description: 'Mengakhiri sesi pengguna dengan menghapus cookie httpOnly `refreshToken` dan membatalkan token.',
        tags: ['Authentication'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Logout berhasil',
            content: {
              'application/json': {
                example: {
                  success: true,
                  message: 'Logout berhasil',
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/forgot-password': {
      post: {
        summary: 'Minta Reset Password via Email',
        description: 'Mengirimkan email berisi tautan token reset password ke alamat email pengguna terdaftar.',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', format: 'email', description: 'Email terdaftar', example: 'pelajar@jadipetani.com' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Permintaan reset password berhasil diproses',
            content: {
              'application/json': {
                example: {
                  success: true,
                  message: 'Jika email terdaftar, instruksi reset password telah dikirim ke email Anda.',
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/reset-password': {
      post: {
        summary: 'Reset Password Menggunakan Token Reset',
        description: 'Mengubah password pengguna menggunakan token rahasia yang dikirim melalui email.',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token', 'password', 'confirmPassword'],
                properties: {
                  token: { type: 'string', description: 'Token reset password dari email', example: 'reset-token-abc123xyz' },
                  password: { type: 'string', format: 'password', description: 'Password baru (minimal 8 karakter)', example: 'newpassword123' },
                  confirmPassword: { type: 'string', format: 'password', description: 'Konfirmasi password baru', example: 'newpassword123' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Password berhasil diubah',
            content: {
              'application/json': {
                example: {
                  success: true,
                  message: 'Password berhasil diubah. Silakan login kembali.',
                },
              },
            },
          },
          400: { description: 'Token reset password tidak valid atau sudah kadaluwarsa' },
        },
      },
    },

    // ============================================
    // 4. USER PROFILE
    // ============================================
    '/api/users/profile': {
      get: {
        summary: 'Detail Profil Pengguna Lengkap',
        description: 'Mengambil informasi lengkap profil pengguna termasuk kontak, institusi, bio, dan alamat.',
        tags: ['User Profile'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Data profil berhasil diambil',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    id: 'u1234567-89ab-cdef-0123-456789abcdef',
                    fullName: 'Siti Rahmawati',
                    email: 'pelajar@jadipetani.com',
                    role: 'STUDENT',
                    phone: '081234567890',
                    address: 'Bogor Barat, Jawa Barat',
                    institution: 'Institut Pertanian Bogor',
                    bio: 'Pengembang pertanian hidroponik muda.',
                    avatarUrl: 'https://xxx.supabase.co/storage/v1/object/public/avatars/user-123.jpg',
                  },
                },
              },
            },
          },
        },
      },
      put: {
        summary: 'Perbarui Data Profil Pengguna',
        description: 'Mengubah informasi profil pengguna seperti nama lengkap, nomor telepon, alamat, nama institusi/kampus, dan biodata.',
        tags: ['User Profile'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  fullName: { type: 'string', example: 'Siti Rahmawati, S.P.' },
                  phone: { type: 'string', example: '081234567890' },
                  address: { type: 'string', example: 'Jalan Raya Dramaga No. 15, Bogor' },
                  institution: { type: 'string', example: 'Institut Pertanian Bogor (IPB University)' },
                  bio: { type: 'string', example: 'Fokus pada riset nutrisi tanaman Melon & Cabai hidroponik.' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Profil berhasil diperbarui',
            content: {
              'application/json': {
                example: {
                  success: true,
                  message: 'Profil berhasil diperbarui',
                  data: {
                    fullName: 'Siti Rahmawati, S.P.',
                    phone: '081234567890',
                    institution: 'Institut Pertanian Bogor (IPB University)',
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/users/profile/completion': {
      get: {
        summary: 'Hitung Persentase Kelengkapan Profil Pengguna (0-100%)',
        description: 'Menghitung skor kelengkapan data profil untuk membantu indikator UI frontend (progress bar kelengkapan profil).',
        tags: ['User Profile'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Skor persentase kelengkapan profil berhasil dihitung',
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
        summary: 'Upload Foto Profil / Avatar (Supabase Storage)',
        description: 'Mengunggah foto profil pengguna ke Supabase Storage bucket `avatars` (Format: JPG/PNG/WebP, maksimal 5MB).',
        tags: ['User Profile'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['avatar'],
                properties: {
                  avatar: { type: 'string', format: 'binary', description: 'File gambar avatar (max 5MB)' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Foto profil berhasil diperbarui',
            content: {
              'application/json': {
                example: {
                  success: true,
                  message: 'Foto profil berhasil diperbarui',
                  data: {
                    avatarUrl: 'https://xxx.supabase.co/storage/v1/object/public/avatars/user-123.jpg',
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/users/change-password': {
      put: {
        summary: 'Ganti Password Pengguna',
        description: 'Mengubah password pengguna terotentikasi dengan memverifikasi password lama terlebih dahulu.',
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
                  currentPassword: { type: 'string', format: 'password', example: 'student123' },
                  newPassword: { type: 'string', format: 'password', example: 'newstudent123' },
                  confirmNewPassword: { type: 'string', format: 'password', example: 'newstudent123' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Password berhasil diubah',
            content: {
              'application/json': {
                example: {
                  success: true,
                  message: 'Password berhasil diubah',
                },
              },
            },
          },
          401: { description: 'Password lama yang dimasukkan salah' },
          422: { description: 'Konfirmasi password baru tidak cocok' },
        },
      },
    },
    '/api/users/me': {
      delete: {
        summary: 'Hapus Akun Pengguna Permanen (Cascading Delete)',
        description: 'Menghapus akun pengguna beserta seluruh data relasi (lowongan, lamaran, logbook, sertifikat) secara permanen dari database.',
        tags: ['User Profile'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Akun berhasil dihapus permanen',
            content: {
              'application/json': {
                example: {
                  success: true,
                  message: 'Akun berhasil dihapus',
                },
              },
            },
          },
        },
      },
    },

    // ============================================
    // 5. INTERNSHIPS
    // ============================================
    '/api/internships': {
      get: {
        summary: 'Daftar Lowongan Magang Publik (Search & Filter)',
        description: 'Menampilkan daftar lowongan magang pertanian berstatus `ACTIVE` yang dapat dilamar oleh publik/pelajar.',
        tags: ['Internships'],
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Pencarian nama judul / komoditas', example: 'Melon' },
          { name: 'location', in: 'query', schema: { type: 'string' }, description: 'Filter wilayah lokasi kebun', example: 'Lembang' },
          { name: 'commodity', in: 'query', schema: { type: 'string' }, description: 'Filter jenis komoditas pertanian', example: 'Melon' },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 }, description: 'Nomor halaman pagination', example: 1 },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 }, description: 'Jumlah item per halaman', example: 10 },
        ],
        responses: {
          200: {
            description: 'Daftar magang publik berhasil diambil',
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
        summary: 'Buat Lowongan Magang Baru (Petani)',
        description: 'Petani mendaftarkan program magang baru. Status awal program adalah `DRAFT` sebelum dilengkapi kurikulum dan dipublikasikan.',
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
                  title: { type: 'string', description: 'Judul program magang', example: 'Magang Budidaya Melon Hidroponik' },
                  commodity: { type: 'string', description: 'Komoditas utama', example: 'Melon Hibrida Super' },
                  location: { type: 'string', description: 'Lokasi kebun/perusahaan', example: 'Lembang, Bandung Barat' },
                  durationMonths: { type: 'integer', description: 'Durasi program (bulan)', example: 1 },
                  quota: { type: 'integer', description: 'Kuota peserta magang', example: 4 },
                  deadline: { type: 'string', format: 'date-time', description: 'Batas akhir pendaftaran', example: '2026-09-01T00:00:00.000Z' },
                  facilities: { type: 'string', description: 'Fasilitas yang disediakan', example: 'Akomodasi mes, makan siang gratis, alat kerja' },
                  description: { type: 'string', description: 'Deskripsi detail program', example: 'Program 1 bulan riset formulasi AB Mix & drip fertigation.' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Lowongan magang berhasil dibuat (Status DRAFT)',
            content: {
              'application/json': {
                example: {
                  success: true,
                  message: 'Lowongan magang berhasil dibuat',
                  data: {
                    id: 'i1234567-89ab-cdef-0123-456789abcdef',
                    title: 'Magang Budidaya Melon Hidroponik',
                    status: 'DRAFT',
                  },
                },
              },
            },
          },
          403: { description: 'Hanya peran FARMER yang dapat membuat program magang' },
        },
      },
    },
    '/api/internships/my': {
      get: {
        summary: 'Daftar Lowongan Magang Milik Petani yang Login',
        description: 'Menampilkan seluruh daftar magang yang pernah dibuat petani (semua status: DRAFT, ACTIVE, CLOSED).',
        tags: ['Internships'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['DRAFT', 'ACTIVE', 'CLOSED'] } },
        ],
        responses: {
          200: { description: 'Daftar magang milik petani berhasil diambil' },
        },
      },
    },
    '/api/internships/{id}': {
      get: {
        summary: 'Detail Lowongan Magang & Preview Kurikulum',
        description: 'Mengambil informasi rinci suatu program magang pertanian beserta pratinjau modul kurikulumnya.',
        tags: ['Internships'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'ID Program Magang (UUID)', example: 'i1234567-89ab-cdef-0123-456789abcdef' },
        ],
        responses: {
          200: { description: 'Detail program magang berhasil ditemukan' },
          404: { description: 'Program magang tidak ditemukan' },
        },
      },
      put: {
        summary: 'Edit Lowongan Magang (Petani Pemilik)',
        description: 'Memperbarui data lowongan magang. Hanya dapat dilakukan oleh petani pemilik program.',
        tags: ['Internships'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: 'i1234567-89ab-cdef-0123-456789abcdef' },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string', example: 'Magang Budidaya Melon Organik Super' },
                  commodity: { type: 'string', example: 'Melon Organik' },
                  location: { type: 'string', example: 'Lembang Barat, Bandung' },
                  durationMonths: { type: 'integer', example: 1 },
                  quota: { type: 'integer', example: 5 },
                  status: { type: 'string', enum: ['DRAFT', 'ACTIVE', 'CLOSED'], example: 'ACTIVE' },
                  facilities: { type: 'string', example: 'Akomodasi mes, makan siang, sertifikat digital' },
                  description: { type: 'string', example: 'Program magang 1 bulan praktek lapangan.' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Lowongan magang berhasil diperbarui' },
          403: { description: 'Bukan pemilik lowongan' },
        },
      },
      delete: {
        summary: 'Hapus Lowongan Magang',
        description: 'Menghapus program magang (Soft Delete). Mengirim email notifikasi pembatalan otomatis jika ada pelamar.',
        tags: ['Internships'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: 'i1234567-89ab-cdef-0123-456789abcdef' },
        ],
        responses: {
          200: { description: 'Lowongan magang berhasil dihapus' },
        },
      },
    },
    '/api/internships/{id}/publish': {
      patch: {
        summary: 'Publikasikan Lowongan Magang (DRAFT -> ACTIVE)',
        description: 'Mengubah status magang dari `DRAFT` menjadi `ACTIVE` agar dapat dilamar pelajar. Syarat: Kurikulum wajib sudah dibuat.',
        tags: ['Internships'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: 'i1234567-89ab-cdef-0123-456789abcdef' },
        ],
        responses: {
          200: { description: 'Lowongan magang berhasil dipublikasikan' },
          400: { description: 'Kurikulum belum disusun. Buat kurikulum terlebih dahulu.' },
        },
      },
    },

    // ============================================
    // 6. AI CURRICULUM
    // ============================================
    '/api/internships/{id}/curriculum/generate': {
      post: {
        summary: 'Generate Kurikulum Mingguan Otomatis dengan Google Gemini AI',
        description: `
### ⚠️ CATATAN PENTING UNTUK DEVELOPER FRONTEND (FE):
Endpoint ini **TIDAK MEMERLUKAN REQUEST BODY** (\`requestBody: {}\` / Kosong).

**Alur Kerja Backend:**
Frontend **hanya perlu mengirimkan HTTP POST request** ke URL ini dengan Path Parameter \`{id}\` (ID lowongan magang) dan Header \`Authorization: Bearer <accessToken>\`.
Backend akan **secara otomatis membaca** data komoditas (\`commodity\`), durasi minggu (\`durationWeeks\`), dan deskripsi (\`description\`) dari database lowongan magang tersebut untuk diproses oleh Google Gemini AI.

**Contoh Kode Axios Frontend:**
\`\`\`javascript
// FE HANYA PERLU MEMANGGIL SEPERTI INI (BODY KOSONG {}):
const res = await axios.post(
  \`https://be-jadipetani-production.up.railway.app/api/internships/\${internshipId}/curriculum/generate\`,
  {}, // Body kosong / tidak perlu data
  { headers: { Authorization: \`Bearer \${accessToken}\` } }
);
console.log(res.data.data.curriculum); // Hasil kurikulum buatan AI
\`\`\`
        `,
        tags: ['AI Curriculum'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'ID Program Magang (UUID)', example: 'i1234567-89ab-cdef-0123-456789abcdef' },
        ],
        requestBody: {
          required: false,
          description: 'BERKAS BODY TIDAK DIPERLUKAN. Kirimkan JSON kosong `{}` atau tanpa body.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                description: 'Tidak ada properti yang perlu dikirim dari Frontend.',
                example: {},
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Kurikulum AI berhasil digenerate',
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
                          { name: 'Sterilisasi Media Tanam', description: 'Sterilisasi dengan larutan khusus', weight: 40 },
                          { name: 'Penyemaian Benih di Tray', description: 'Semai 50 benih di tray', weight: 60 },
                        ],
                      },
                      {
                        weekNumber: 2,
                        title: 'Minggu 2: Pindah Tanam & Manajemen Nutrisi AB Mix',
                        description: 'Transplantasi bibit ke sistem hidroponik & perhitungan PPM.',
                        activities: [
                          { name: 'Pindah Tanam Bibit', description: 'Pindahkan bibit daun 4 ke gulud', weight: 50 },
                          { name: 'Pengukuran EC/PPM Nutrisi', description: 'Atur EC nutrisi di angka 1.8 mS/cm', weight: 50 },
                        ],
                      },
                    ],
                  },
                },
              },
            },
          },
          403: { description: 'Hanya peran FARMER pemilik lowongan yang dapat memicu AI Generator' },
          503: { description: 'Layanan Google Gemini AI sedang tidak dapat diakses / rate limited' },
        },
      },
    },
    '/api/internships/{id}/curriculum': {
      get: {
        summary: 'Get Preview Kurikulum Program Magang',
        description: 'Melihat rincian struktur kurikulum mingguan suatu program magang.',
        tags: ['AI Curriculum'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: 'i1234567-89ab-cdef-0123-456789abcdef' },
        ],
        responses: { description: 'Preview kurikulum berhasil diambil' },
      },
      put: {
        summary: 'Simpan / Edit Manual Kurikulum Mingguan',
        description: 'Membuat atau mengedit modul kurikulum mingguan secara manual. Total bobot (*weight*) aktivitas per minggu wajib berjumlah 100%.',
        tags: ['AI Curriculum'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: 'i1234567-89ab-cdef-0123-456789abcdef' },
        ],
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
                        title: { type: 'string', example: 'Minggu 1: Persiapan Lahan' },
                        description: { type: 'string', example: 'Persiapan bedengan lahan' },
                        activities: {
                          type: 'array',
                          items: {
                            type: 'object',
                            required: ['name', 'description', 'weight'],
                            properties: {
                              name: { type: 'string', example: 'Penyangkulan Bedengan' },
                              description: { type: 'string', example: 'Gemburkan tanah hingga kedalaman 30cm' },
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
        responses: {
          200: { description: 'Kurikulum mingguan berhasil disimpan' },
          422: { description: 'Total bobot aktivitas per minggu tidak sama dengan 100' },
        },
      },
      delete: {
        summary: 'Reset / Hapus Kurikulum Program Magang',
        description: 'Menghapus kurikulum yang ada (hanya untuk magang berstatus DRAFT).',
        tags: ['AI Curriculum'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: 'i1234567-89ab-cdef-0123-456789abcdef' },
        ],
        responses: {
          200: { description: 'Kurikulum berhasil dihapus' },
          400: { description: 'Kurikulum magang ACTIVE tidak dapat dihapus' },
        },
      },
    },

    // ============================================
    // 7. APPLICATIONS & APPLICANTS
    // ============================================
    '/api/internships/{id}/apply': {
      post: {
        summary: 'Kirim Lamaran Magang (Pelajar)',
        description: 'Pelajar mengajukan lamaran magang dengan mengunggah berkas CV (PDF wajib) & Portofolio (PDF opsional) yang disimpan di Supabase Storage.',
        tags: ['Applications'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: 'i1234567-89ab-cdef-0123-456789abcdef' },
        ],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['cv', 'motivation'],
                properties: {
                  cv: { type: 'string', format: 'binary', description: 'File CV PDF (Maksimal 5MB)' },
                  portfolio: { type: 'string', format: 'binary', description: 'File Portofolio PDF (Maksimal 5MB, opsional)' },
                  motivation: { type: 'string', description: 'Surat motivasi melamar magang', example: 'Saya sangat berminat mempraktikkan riset hidroponik secara langsung.' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Lamaran magang berhasil dikirim' },
          400: { description: 'Anda sudah pernah melamar / Kuota penuh / Batas 5 lamaran aktif tercapai' },
        },
      },
    },
    '/api/jobs/{id}/apply': {
      post: {
        summary: 'Kirim Lamaran Pekerjaan Job Connector (Pelajar)',
        description: 'Pelajar mengajukan lamaran pekerjaan ke lowongan profesional Job Connector.',
        tags: ['Applications'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: 'j1234567-89ab-cdef-0123-456789abcdef' },
        ],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['cv', 'motivation'],
                properties: {
                  cv: { type: 'string', format: 'binary', description: 'File CV PDF (Maksimal 5MB)' },
                  portfolio: { type: 'string', format: 'binary', description: 'File Portofolio PDF (Maksimal 5MB)' },
                  motivation: { type: 'string', example: 'Pengalaman 2 tahun mengelola perkebunan hortikultura.' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Lamaran pekerjaan berhasil dikirim' },
        },
      },
    },
    '/api/applications/my': {
      get: {
        summary: 'List Riwayat Lamaran Milik Pelajar Login',
        description: 'Menampilkan seluruh riwayat lamaran magang & pekerjaan yang dikirimkan pelajar beserta statusnya (`REVIEW`, `ACCEPTED`, `REJECTED`, `CANCELLED`).',
        tags: ['Applications'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'type', in: 'query', schema: { type: 'string', enum: ['INTERNSHIP', 'JOB'] } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['REVIEW', 'ACCEPTED', 'REJECTED', 'CANCELLED'] } },
        ],
        responses: {
          200: { description: 'Daftar lamaran pelajar berhasil diambil' },
        },
      },
    },
    '/api/applications/{id}': {
      get: {
        summary: 'Detail Lamaran & Signed URL Berkas PDF',
        description: 'Melihat detail berkas lamaran beserta Signed URL sementara (berlaku 1 jam) untuk mengunduh CV & Portofolio dari Supabase Storage.',
        tags: ['Applications'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: 'a1234567-89ab-cdef-0123-456789abcdef' },
        ],
        responses: {
          200: { description: 'Detail lamaran & signed link PDF berhasil didapat' },
        },
      },
      delete: {
        summary: 'Batalkan / Hapus Lamaran (Pelajar)',
        description: 'Pelajar membatalkan lamaran yang dikirimnya (hanya untuk lamaran berstatus REVIEW).',
        tags: ['Applications'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: 'a1234567-89ab-cdef-0123-456789abcdef' },
        ],
        responses: {
          200: { description: 'Lamaran berhasil dibatalkan' },
        },
      },
    },
    '/api/internships/{id}/applicants': {
      get: {
        summary: 'Daftar Pelamar Program Magang (Petani Pemilik)',
        description: 'Petani melihat daftar pendaftar yang melamar pada program magang pertanian miliknya.',
        tags: ['Applicant Management'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: 'i1234567-89ab-cdef-0123-456789abcdef' },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Cari nama pendaftar' },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['REVIEW', 'ACCEPTED', 'REJECTED'] } },
          { name: 'institution', in: 'query', schema: { type: 'string' }, description: 'Filter asal instansi/kampus' },
        ],
        responses: {
          200: { description: 'Daftar pelamar magang berhasil diambil' },
        },
      },
    },
    '/api/jobs/{id}/applicants': {
      get: {
        summary: 'Daftar Pelamar Pekerjaan Job Connector (Petani Pemilik)',
        description: 'Petani melihat daftar kandidat pekerja yang melamar lowongan profesional.',
        tags: ['Applicant Management'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: 'j1234567-89ab-cdef-0123-456789abcdef' },
        ],
        responses: {
          200: { description: 'Daftar pelamar pekerjaan berhasil diambil' },
        },
      },
    },
    '/api/applications/{id}/accept': {
      patch: {
        summary: 'Terima Pelamar Magang (Sistem Memeriksa Kuota & Membuat AI Logbook)',
        description: 'Petani menerima pelamar. Sistem memverifikasi sisa kuota magang, mengubah status menjadi `ACCEPTED`, dan secara otomatis menggenerate **AI Logbook Mingguan** & tabel **Evaluasi** peserta.',
        tags: ['Applicant Management'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: 'a1234567-89ab-cdef-0123-456789abcdef' },
        ],
        responses: {
          200: { description: 'Pelamar berhasil diterima & logbook otomatis terbuat' },
          400: { description: 'Kuota magang sudah penuh' },
        },
      },
    },
    '/api/applications/{id}/reject': {
      patch: {
        summary: 'Tolak Pelamar Magang',
        description: 'Petani menolak lamaran peserta. Sistem akan mengirim email pemberitahuan ke peserta.',
        tags: ['Applicant Management'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: 'a1234567-89ab-cdef-0123-456789abcdef' },
        ],
        responses: {
          200: { description: 'Pelamar berhasil ditolak' },
        },
      },
    },

    // ============================================
    // 8. MY INTERNSHIPS & AI LOGBOOK
    // ============================================
    '/api/my-internships': {
      get: {
        summary: 'Daftar Program Magang yang Sedang / Pernah Diikuti Pelajar',
        description: 'Menampilkan seluruh daftar magang berstatus ACCEPTED yang diikuti oleh pelajar terotentikasi.',
        tags: ['My Internships & AI Logbook'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Daftar program magang aktif peserta' },
        },
      },
    },
    '/api/my-internships/{id}/logbook': {
      get: {
        summary: 'Get Data Logbook Mingguan & Persentase Total Progress Magang',
        description: 'Mengambil seluruh ringkasan minggu logbook peserta, persentase penyelesaian keseluruhan (0-100%), dan status verifikasi.',
        tags: ['My Internships & AI Logbook'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Application ID', example: 'a1234567-89ab-cdef-0123-456789abcdef' },
        ],
        responses: {
          200: { description: 'Data logbook peserta berhasil diambil' },
        },
      },
    },
    '/api/my-internships/{id}/logbook/week/{weekNumber}': {
      put: {
        summary: 'Update Checklist Aktivitas & Refleksi Jurnal Mingguan (Peserta)',
        description: 'Peserta memperbarui checklist tugas mingguan dan menuliskan catatan refleksi jurnal kegiatan.',
        tags: ['My Internships & AI Logbook'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: 'a1234567-89ab-cdef-0123-456789abcdef' },
          { name: 'weekNumber', in: 'path', required: true, schema: { type: 'integer' }, example: 1 },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  reflection: { type: 'string', description: 'Jurnal refleksi pengalaman minggu ini', example: 'Minggu ini berhasil menyemai 50 benih melon dengan tingkat daya kecambah 95%.' },
                  activities: {
                    type: 'array',
                    description: 'Daftar status centang aktivitas',
                    items: {
                      type: 'object',
                      required: ['id', 'isCompleted'],
                      properties: {
                        id: { type: 'string', example: 'act-12345' },
                        isCompleted: { type: 'boolean', example: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Checklist & refleksi logbook minggu ini berhasil disimpan' },
        },
      },
    },
    '/api/my-internships/{id}/logbook/week/{weekNumber}/evidence': {
      post: {
        summary: 'Upload Foto Bukti Dokumen Kegiatan Minggu Ini (Supabase Storage)',
        description: 'Mengunggah foto-foto dokumentasi bukti kegiatan praktek mingguan ke bucket Supabase `logbook-docs`.',
        tags: ['My Internships & AI Logbook'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: 'a1234567-89ab-cdef-0123-456789abcdef' },
          { name: 'weekNumber', in: 'path', required: true, schema: { type: 'integer' }, example: 1 },
        ],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['documentation'],
                properties: {
                  documentation: {
                    type: 'array',
                    items: { type: 'string', format: 'binary' },
                    description: 'File gambar bukti kegiatan (JPG/PNG, maksimal 10 file sekaligus)',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Foto bukti dokumentasi kegiatan berhasil diunggah' },
        },
      },
    },

    // ============================================
    // 9. EVALUATION & CERTIFICATE
    // ============================================
    '/api/internships/{internshipId}/evaluations/{applicantId}': {
      get: {
        summary: 'Get Data Lembar Evaluasi Peserta (Petani)',
        description: 'Petani melihat lembar penilaian mingguan peserta magang beserta skor checklist dan dokumentasinya.',
        tags: ['Evaluation & Certificate'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'internshipId', in: 'path', required: true, schema: { type: 'string' }, example: 'i1234567-89ab-cdef-0123-456789abcdef' },
          { name: 'applicantId', in: 'path', required: true, schema: { type: 'string' }, example: 'a1234567-89ab-cdef-0123-456789abcdef' },
        ],
        responses: {
          200: { description: 'Data evaluasi peserta magang berhasil diambil' },
        },
      },
    },
    '/api/evaluations/{id}/grade': {
      patch: {
        summary: 'Berikan Skor Penilaian (1-100) & Catatan Petani Per Minggu',
        description: 'Petani memberikan nilai kuantitatif (skala 1-100) dan catatan bimbingan untuk evaluasi minggu tertentu.',
        tags: ['Evaluation & Certificate'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Evaluation ID per minggu', example: 'eval-12345' },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['score'],
                properties: {
                  score: { type: 'integer', description: 'Nilai kuantitatif (1-100)', example: 90 },
                  notes: { type: 'string', description: 'Catatan pembimbing/petani', example: 'Sangat teliti dalam racikan larutan AB Mix.' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Penilaian minggu ini berhasil disimpan' },
        },
      },
    },
    '/api/internships/{internshipId}/evaluations/{applicantId}/ai-summary': {
      post: {
        summary: 'Generate Ringkasan Evaluasi AI Gemini (Kompetensi Utama & Area Pengembangan)',
        description: 'Google Gemini AI menganalisis seluruh checklist, jurnal refleksi, dan skor peserta untuk menyusun ringkasan **Kompetensi Utama** dan **Area Yang Perlu Ditingkatkan**.',
        tags: ['Evaluation & Certificate'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'internshipId', in: 'path', required: true, schema: { type: 'string' }, example: 'i1234567-89ab-cdef-0123-456789abcdef' },
          { name: 'applicantId', in: 'path', required: true, schema: { type: 'string' }, example: 'a1234567-89ab-cdef-0123-456789abcdef' },
        ],
        responses: {
          200: {
            description: 'Ringkasan AI berhasil di-generate',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    overallScore: 88,
                    mainCompetencies: ['Sterilisasi Media Tanam', 'Formulasi AB Mix', 'Manajemen Drip Fertigation'],
                    areasForImprovement: ['Deteksi Dini Hama Thrips'],
                    summary: 'Peserta menunjukkan penguasaan yang luar biasa pada teknologi hidroponik modern.',
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/internships/{internshipId}/evaluations/{applicantId}/graduate': {
      post: {
        summary: 'Luluskan Peserta & Terbitkan Sertifikat Digital PDF Lanskap',
        description: 'Petani meluluskan peserta magang. Sistem secara otomatis membuat berkas Sertifikat Digital PDF Lanskap menggunakan PDFKit, menerbitkan nomor lisensi resmi `JP-CERT-YYYY-XXXX`, dan mengunggah file ke Supabase Storage.',
        tags: ['Evaluation & Certificate'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'internshipId', in: 'path', required: true, schema: { type: 'string' }, example: 'i1234567-89ab-cdef-0123-456789abcdef' },
          { name: 'applicantId', in: 'path', required: true, schema: { type: 'string' }, example: 'a1234567-89ab-cdef-0123-456789abcdef' },
        ],
        responses: {
          201: {
            description: 'Peserta berhasil diluluskan & Sertifikat PDF diterbitkan',
            content: {
              'application/json': {
                example: {
                  success: true,
                  message: 'Peserta berhasil diluluskan. Sertifikat digital telah terbit.',
                  data: {
                    certificate: {
                      id: 'cert-12345',
                      certificateNumber: 'JP-CERT-2026-0001',
                      downloadUrl: 'https://be-jadipetani-production.up.railway.app/api/certificates/cert-12345/download',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ============================================
    // 10. CERTIFICATES
    // ============================================
    '/api/certificates/my': {
      get: {
        summary: 'Daftar Sertifikat Kelulusan Milik Pelajar Login',
        description: 'Menampilkan seluruh daftar sertifikat digital yang berhasil diperoleh oleh pelajar.',
        tags: ['Certificates'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Daftar sertifikat pelajar berhasil diambil' },
        },
      },
    },
    '/api/certificates/{id}': {
      get: {
        summary: 'Detail Data Sertifikat Digital',
        description: 'Melihat rincian metadata sertifikat digital, nama penerbit, tanggal terbit, dan tautan unduh PDF.',
        tags: ['Certificates'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: 'cert-12345' },
        ],
        responses: {
          200: { description: 'Detail sertifikat berhasil diambil' },
        },
      },
      delete: {
        summary: 'Cabut / Hapus Sertifikat Digital (Petani Pemilik)',
        description: 'Membatalkan atau menghapus lisensi sertifikat digital.',
        tags: ['Certificates'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: 'cert-12345' },
        ],
        responses: {
          200: { description: 'Sertifikat berhasil dihapus/dicabut' },
        },
      },
    },
    '/api/certificates/{id}/download': {
      get: {
        summary: 'Download File PDF Sertifikat (302 Redirect / Stream)',
        description: 'Mengunduh langsung berkas file PDF Sertifikat Lanskap resmi.',
        tags: ['Certificates'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: 'cert-12345' },
        ],
        responses: {
          302: { description: 'Redirect 302 ke Supabase Storage Public PDF URL' },
        },
      },
    },

    // ============================================
    // 11. JOB CONNECTOR & PAYMENTS
    // ============================================
    '/api/jobs': {
      get: {
        summary: 'Daftar Lowongan Kerja Profesional Published (Publik)',
        description: 'Menampilkan daftar lowongan kerja profesional berstatus `PUBLISHED` (pembayaran Placement Fee telah settlement).',
        tags: ['Job Connector'],
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Cari judul pekerjaan' },
          { name: 'location', in: 'query', schema: { type: 'string' }, description: 'Filter lokasi' },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: {
          200: { description: 'Daftar lowongan pekerjaan publik' },
        },
      },
      post: {
        summary: 'Buat Lowongan Kerja + Generate Midtrans Snap Payment Token',
        description: 'Petani membuat lowongan kerja. Backend menghitung **Placement Fee 50%** dari gaji tawaran dan menerbitkan Midtrans Snap Token (`snapToken`) untuk modal checkout pembayaran.',
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
                  description: { type: 'string', example: 'Mengawasi operasional perkebunan sawit komersial 500 hektar.' },
                  qualifications: { type: 'string', example: 'S1 Pertanian, pengalaman lapangan minimal 3 tahun.' },
                  offeredSalary: { type: 'integer', description: 'Gaji bulanan Rp (Placement Fee otomatis 50% = Rp 4.000.000)', example: 8000000 },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Lowongan kerja dibuat & Token Midtrans Snap berhasil diterbitkan',
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
        description: 'Menampilkan seluruh lowongan kerja milik petani (semua status: UNPAID, PENDING_PAYMENT, PUBLISHED, EXPIRED, CLOSED).',
        tags: ['Job Connector'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
        ],
        responses: { description: 'Daftar pekerjaan milik petani' },
      },
    },
    '/api/jobs/{id}': {
      get: {
        summary: 'Detail Lowongan Pekerjaan',
        tags: ['Job Connector'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: 'j1234567-89ab-cdef-0123-456789abcdef' },
        ],
        responses: { description: 'Detail pekerjaan berhasil diambil' },
      },
      put: {
        summary: 'Edit Data Lowongan Pekerjaan',
        tags: ['Job Connector'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: 'j1234567-89ab-cdef-0123-456789abcdef' },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string', example: 'Senior Farm Manager' },
                  location: { type: 'string', example: 'Pekanbaru' },
                  description: { type: 'string', example: 'Kelola operasional lahan.' },
                  qualifications: { type: 'string', example: 'Pengalaman 5 tahun.' },
                  offeredSalary: { type: 'integer', example: 10000000 },
                },
              },
            },
          },
        },
        responses: { description: 'Data lowongan kerja berhasil diperbarui' },
      },
      delete: {
        summary: 'Hapus Lowongan Pekerjaan',
        tags: ['Job Connector'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: 'j1234567-89ab-cdef-0123-456789abcdef' },
        ],
        responses: { description: 'Lowongan kerja berhasil dihapus' },
      },
    },
    '/api/jobs/{id}/close': {
      patch: {
        summary: 'Tutup Lowongan Pekerjaan Manual',
        tags: ['Job Connector'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: 'j1234567-89ab-cdef-0123-456789abcdef' },
        ],
        responses: { description: 'Lowongan kerja ditutup' },
      },
    },
    '/api/jobs/{id}/retry-payment': {
      post: {
        summary: 'Buat Ulang Token Midtrans Snap (Retry Payment)',
        description: 'Menerbitkan Snap token pembayaran baru jika transaksi pembayaran sebelumnya kadaluwarsa (*EXPIRED*) atau batal.',
        tags: ['Job Connector'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: 'j1234567-89ab-cdef-0123-456789abcdef' },
        ],
        responses: {
          200: { description: 'Token Midtrans Snap baru berhasil diterbitkan' },
        },
      },
    },
    '/api/jobs/{id}/payment-status': {
      get: {
        summary: 'Cek Status Transaksi Langsung ke Midtrans API (Reconciliation)',
        description: 'Melakukan rekonsiliasi manual dengan memeriksa status pembayaran langsung ke server Midtrans API.',
        tags: ['Job Connector'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: 'j1234567-89ab-cdef-0123-456789abcdef' },
        ],
        responses: { description: 'Status transaksi terkini dari Midtrans' },
      },
    },
    '/api/payments/midtrans/callback': {
      post: {
        summary: 'Webhook Notification Callback dari Server Midtrans',
        description: 'Endpoint webhook otomatis yang dipanggil oleh server Midtrans. Memverifikasi **SHA-512 Signature Key** (`order_id` + `status_code` + `gross_amount` + `Server Key`) dan bersifat **idempotent**.',
        tags: ['Payments'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['order_id', 'status_code', 'gross_amount', 'signature_key', 'transaction_status'],
                properties: {
                  order_id: { type: 'string', example: 'JOB-FEE-1723456789-0123' },
                  status_code: { type: 'string', example: '200' },
                  gross_amount: { type: 'string', example: '4000000.00' },
                  signature_key: { type: 'string', example: 'a1b2c3d4e5f6...' },
                  transaction_status: { type: 'string', example: 'settlement' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Callback webhook berhasil diproses & status lowongan diperbarui' },
          401: { description: 'Signature key webhook tidak valid' },
        },
      },
    },

    // ============================================
    // 12. BOOKMARKS
    // ============================================
    '/api/bookmarks': {
      post: {
        summary: 'Simpan / Bookmark Lowongan (Magang atau Pekerjaan)',
        description: 'Pelajar menyimpan lowongan magang atau pekerjaan ke daftar bookmark favorit.',
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
        responses: {
          201: { description: 'Lowongan berhasil disimpan di bookmark' },
        },
      },
    },
    '/api/bookmarks/my': {
      get: {
        summary: 'Daftar Bookmark Milik Pelajar Login',
        description: 'Menampilkan seluruh daftar lowongan yang telah disimpan oleh pelajar.',
        tags: ['Bookmarks'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Daftar bookmark pelajar berhasil diambil' },
        },
      },
    },
    '/api/bookmarks/{id}': {
      delete: {
        summary: 'Hapus Bookmark',
        description: 'Menghapus lowongan dari daftar simpanan bookmark.',
        tags: ['Bookmarks'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: 'bm-12345' },
        ],
        responses: {
          200: { description: 'Bookmark berhasil dihapus' },
        },
      },
    },

    // ============================================
    // 13. DASHBOARD
    // ============================================
    '/api/dashboard/farmer': {
      get: {
        summary: 'Statistik Ringkasan Dashboard Petani',
        description: 'Mengambil ringkasan matriks statistik untuk Dashboard Petani (total lowongan aktif, pelamar baru, peserta magang aktif, dan sertifikat yang terbit).',
        tags: ['Dashboard'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Statistik dashboard petani berhasil diambil',
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
        description: 'Mengambil ringkasan matriks statistik untuk Dashboard Pelajar (total lamaran aktif, program magang berjalan, jumlah checklist selesai, dan sertifikat didapat).',
        tags: ['Dashboard'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Statistik dashboard pelajar berhasil diambil',
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
