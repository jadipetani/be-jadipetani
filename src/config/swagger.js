const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: '🌾 Jadipetani Backend API',
    version: '1.0.0',
    description: 'Dokumentasi interaktif RESTful API Jadipetani — Magang Pertanian, AI Logbook, AI Curriculum, Sertifikat Digital PDF, dan Job Connector.',
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Development Server (Lokal)',
    },
    {
      url: 'https://be-jadipetani-production.up.railway.app',
      description: 'Production Server (Railway)',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Masukkan Access Token JWT (dapat dari /api/auth/login)',
      },
    },
  },
  paths: {
    '/api/health': {
      get: {
        summary: 'Health Check Server',
        tags: ['Health'],
        responses: {
          200: {
            description: 'Server berjalan normal',
          },
        },
      },
    },
    '/api/landing/stats': {
      get: {
        summary: 'Statistik Platform (Publik)',
        tags: ['Landing'],
        responses: {
          200: { description: 'Statistik petani, pelajar, dan program' },
        },
      },
    },
    '/api/auth/register': {
      post: {
        summary: 'Registrasi User Baru',
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
        responses: {
          201: { description: 'Registrasi berhasil' },
          409: { description: 'Email sudah terdaftar' },
        },
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
        responses: {
          200: { description: 'Login berhasil, token dikembalikan + cookie refresh set' },
          401: { description: 'Email atau password salah' },
        },
      },
    },
    '/api/auth/me': {
      get: {
        summary: 'Profil User Login',
        tags: ['Authentication'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Data profil user' },
          401: { description: 'Token tidak valid / expired' },
        },
      },
    },
    '/api/internships': {
      get: {
        summary: 'List Lowongan Magang Publik',
        tags: ['Internships'],
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'location', in: 'query', schema: { type: 'string' } },
          { name: 'commodity', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: {
          200: { description: 'List lowongan magang aktif' },
        },
      },
      post: {
        summary: 'Buat Lowongan Magang Baru (Petani)',
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
                  title: { type: 'string', example: 'Magang Budidaya Tomat Organik' },
                  commodity: { type: 'string', example: 'Tomat Organik' },
                  location: { type: 'string', example: 'Lembang, Bandung Barat' },
                  durationMonths: { type: 'integer', example: 1 },
                  quota: { type: 'integer', example: 5 },
                  deadline: { type: 'string', example: '2026-09-01T00:00:00.000Z' },
                  facilities: { type: 'string', example: 'Akomodasi mes, makan siang' },
                  description: { type: 'string', example: 'Program magang 1 bulan intensif...' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Lowongan magang berhasil dibuat' },
        },
      },
    },
    '/api/jobs': {
      get: {
        summary: 'List Lowongan Kerja Publik (Published)',
        tags: ['Job Connector'],
        responses: {
          200: { description: 'List lowongan kerja profesional' },
        },
      },
      post: {
        summary: 'Buat Lowongan Kerja + Midtrans Payment (Petani)',
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
                  title: { type: 'string', example: 'Agronomis Lapangan' },
                  location: { type: 'string', example: 'Bogor, Jawa Barat' },
                  description: { type: 'string', example: 'Mengelola kebun komersial...' },
                  qualifications: { type: 'string', example: 'S1 Pertanian, pengalaman 1 tahun...' },
                  offeredSalary: { type: 'integer', example: 5000000 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Lowongan terbuat, snapToken Midtrans dikembalikan' },
        },
      },
    },
    '/api/certificates/my': {
      get: {
        summary: 'List Sertifikat Milik Pelajar',
        tags: ['Certificates'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Daftar sertifikat kelulusan' },
        },
      },
    },
    '/api/users/profile/completion': {
      get: {
        summary: 'Hitung Persentase Kelengkapan Profil',
        tags: ['User Profile'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Persentase kelengkapan profil (0-100%)' },
        },
      },
    },
    '/api/users/profile/avatar': {
      post: {
        summary: 'Upload Foto Profil ke Supabase Storage',
        tags: ['User Profile'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Foto profil berhasil diperbarui' },
        },
      },
    },
    '/api/bookmarks': {
      post: {
        summary: 'Bookmark Lowongan (Magang / Job)',
        tags: ['Bookmarks'],
        security: [{ bearerAuth: [] }],
        responses: {
          201: { description: 'Lowongan berhasil di-bookmark' },
        },
      },
    },
    '/api/bookmarks/my': {
      get: {
        summary: 'List Bookmark Milik Pelajar',
        tags: ['Bookmarks'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Daftar bookmark lowongan' },
        },
      },
    },
    '/api/my-internships': {
      get: {
        summary: 'List Program Magang Aktif/Lulus Milik Pelajar',
        tags: ['My Internships'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Daftar program magang yang diikuti' },
        },
      },
    },
  },
};

module.exports = openApiSpec;
