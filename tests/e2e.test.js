require('dotenv').config();
const app = require('../src/app');
const http = require('http');

let server;
let baseUrl;

// Shared state between test steps
let farmerToken;
let studentToken;
let farmerUser;
let studentUser;
let internshipId;
let jobId;

async function request(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const headers = { 'Content-Type': 'application/json', ...options.headers };

  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const json = await response.json();
  return { status: response.status, body: json };
}

async function runTests() {
  console.log('🧪 Starting End-to-End API Integration Tests...\n');
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASSED: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAILED: ${name}`);
      console.error(`     Error: ${err.message}`);
      failed++;
    }
  }

  // 1. Health & Landing
  await test('GET /api/health should return 200 OK', async () => {
    const res = await request('/api/health');
    if (res.status !== 200 || !res.body.success) throw new Error(`Status ${res.status}`);
  });

  await test('GET /api/landing/stats should return 200 OK with platform counts', async () => {
    const res = await request('/api/landing/stats');
    if (res.status !== 200 || res.body.data.registeredFarmers === undefined) throw new Error(`Status ${res.status}`);
  });

  // 2. Auth Module
  const testFarmerEmail = `farmer_${Date.now()}@jadipetani.com`;
  const testStudentEmail = `student_${Date.now()}@jadipetani.com`;

  await test('POST /api/auth/register (FARMER) should return 201 Created', async () => {
    const res = await request('/api/auth/register', {
      method: 'POST',
      body: {
        fullName: 'Pak Tani Test',
        email: testFarmerEmail,
        password: 'password123',
        confirmPassword: 'password123',
        role: 'FARMER',
        agreedToTerms: true,
      },
    });
    if (res.status !== 201) throw new Error(`Status ${res.status}: ${res.body.message}`);
    farmerToken = res.body.data.accessToken;
    farmerUser = res.body.data.user;
  });

  await test('POST /api/auth/register (STUDENT) should return 201 Created', async () => {
    const res = await request('/api/auth/register', {
      method: 'POST',
      body: {
        fullName: 'Mahasiswa Test',
        email: testStudentEmail,
        password: 'password123',
        confirmPassword: 'password123',
        role: 'STUDENT',
        agreedToTerms: true,
      },
    });
    if (res.status !== 201) throw new Error(`Status ${res.status}: ${res.body.message}`);
    studentToken = res.body.data.accessToken;
    studentUser = res.body.data.user;
  });

  await test('POST /api/auth/login (FARMER) should return 200 OK', async () => {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: { email: testFarmerEmail, password: 'password123' },
    });
    if (res.status !== 200 || !res.body.data.accessToken) throw new Error(`Status ${res.status}`);
  });

  await test('GET /api/users/profile should return current user profile', async () => {
    const res = await request('/api/users/profile', { token: farmerToken });
    if (res.status !== 200 || res.body.data.email !== testFarmerEmail) throw new Error(`Status ${res.status}`);
  });

  await test('PUT /api/users/profile should update profile fields', async () => {
    const res = await request('/api/users/profile', {
      method: 'PUT',
      token: farmerToken,
      body: { phone: '081122334455', institution: 'Kelompok Tani Subur' },
    });
    if (res.status !== 200 || res.body.data.phone !== '081122334455') throw new Error(`Status ${res.status}`);
  });

  // 3. Internship CRUD Module
  await test('POST /api/internships should create a new internship draft', async () => {
    const res = await request('/api/internships', {
      method: 'POST',
      token: farmerToken,
      body: {
        title: 'Magang Hydroponic Melon',
        commodity: 'Melon Hibrida',
        location: 'Lembang, Bandung',
        durationMonths: 1,
        quota: 3,
        deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        facilities: 'Akomodasi & Makan',
        description: 'Belajar budidaya melon hidroponik sistem Drip Irrigation.',
        status: 'DRAFT',
      },
    });
    if (res.status !== 201) throw new Error(`Status ${res.status}: ${res.body.message}`);
    internshipId = res.body.data.id;
  });

  await test('PUT /api/internships/:id/curriculum should create manual curriculum', async () => {
    const res = await request(`/api/internships/${internshipId}/curriculum`, {
      method: 'PUT',
      token: farmerToken,
      body: {
        curriculum: [
          {
            weekNumber: 1,
            title: 'Minggu 1: Persemaian',
            description: 'Semai benih melon',
            activities: [
              { name: 'Media Tanam', description: 'Campur cocopeat', weight: 50 },
              { name: 'Semaian', description: 'Tanam benih di tray', weight: 50 },
            ],
          },
          {
            weekNumber: 2,
            title: 'Minggu 2: Pindah Tanam',
            description: 'Pindah ke greenhouse',
            activities: [
              { name: 'Pindah Tanaman', description: 'Tanam ke polybag', weight: 100 },
            ],
          },
        ],
      },
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}: ${res.body.message}`);
  });

  await test('PATCH /api/internships/:id/publish should publish the draft internship', async () => {
    const res = await request(`/api/internships/${internshipId}/publish`, {
      method: 'PATCH',
      token: farmerToken,
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}: ${res.body.message}`);
  });

  await test('GET /api/internships should list public active internships', async () => {
    const res = await request('/api/internships');
    if (res.status !== 200 || !Array.isArray(res.body.data)) throw new Error(`Status ${res.status}`);
  });

  await test('GET /api/internships/:id should return detail of internship', async () => {
    const res = await request(`/api/internships/${internshipId}`);
    if (res.status !== 200 || res.body.data.id !== internshipId) throw new Error(`Status ${res.status}`);
  });

  await test('GET /api/internships/my should return farmer owned internships', async () => {
    const res = await request('/api/internships/my', { token: farmerToken });
    if (res.status !== 200 || res.body.data.length === 0) throw new Error(`Status ${res.status}`);
  });

  // 4. Applications Module
  await test('GET /api/applications/my should return student applications list', async () => {
    const res = await request('/api/applications/my', { token: studentToken });
    if (res.status !== 200 || !Array.isArray(res.body.data)) throw new Error(`Status ${res.status}`);
  });

  await test('GET /api/internships/:id/applicants should return applicants list for farmer', async () => {
    const res = await request(`/api/internships/${internshipId}/applicants`, { token: farmerToken });
    if (res.status !== 200 || !Array.isArray(res.body.data)) throw new Error(`Status ${res.status}`);
  });

  // 5. Dashboard Module
  await test('GET /api/dashboard/farmer should return farmer dashboard stats', async () => {
    const res = await request('/api/dashboard/farmer', { token: farmerToken });
    if (res.status !== 200 || res.body.data.activeListings === undefined) throw new Error(`Status ${res.status}`);
  });

  await test('GET /api/dashboard/student should return student dashboard stats', async () => {
    const res = await request('/api/dashboard/student', { token: studentToken });
    if (res.status !== 200 || res.body.data.activeApplications === undefined) throw new Error(`Status ${res.status}`);
  });

  // 6. Job Connector Module (CRUD)
  await test('POST /api/jobs should create a job with backend placement fee calculation', async () => {
    const res = await request('/api/jobs', {
      method: 'POST',
      token: farmerToken,
      body: {
        title: 'Manajer Kebun Kelapa Sawit',
        location: 'Pekanbaru, Riau',
        description: 'Mengawasi operasional kebun kelapa sawit 500 hektar.',
        qualifications: 'S1 Pertanian, pengalaman 3 tahun.',
        offeredSalary: 8000000,
      },
    });
    if (res.status !== 201 || res.body.data.job.placementFee !== 4000000) {
      throw new Error(`Status ${res.status}: Expected placementFee 4000000, got ${res.body.data?.job?.placementFee}`);
    }
    jobId = res.body.data.job.id;
  });

  await test('GET /api/jobs/my should return farmer owned jobs', async () => {
    const res = await request('/api/jobs/my', { token: farmerToken });
    if (res.status !== 200 || res.body.data.length === 0) throw new Error(`Status ${res.status}`);
  });

  await test('PUT /api/jobs/:id should update job details', async () => {
    const res = await request(`/api/jobs/${jobId}`, {
      method: 'PUT',
      token: farmerToken,
      body: { location: 'Pekanbaru, Riau' },
    });
    if (res.status !== 200 || res.body.data.location !== 'Pekanbaru, Riau') throw new Error(`Status ${res.status}`);
  });

  await test('DELETE /api/jobs/:id should delete job', async () => {
    const res = await request(`/api/jobs/${jobId}`, {
      method: 'DELETE',
      token: farmerToken,
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}: ${res.body.message}`);
  });

  console.log(`\n📊 E2E Integration Test Summary:`);
  console.log(`   Total Tests: ${passed + failed}`);
  console.log(`   Passed:      ${passed}`);
  console.log(`   Failed:      ${failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

// Start temporary test server
server = http.createServer(app);
server.listen(0, '127.0.0.1', async () => {
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;
  try {
    await runTests();
  } finally {
    server.close();
  }
});
