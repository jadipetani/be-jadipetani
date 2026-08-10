require('dotenv').config();
const request = require('supertest');
const app = require('../src/app');

let farmerToken;
let studentToken;
let farmerId;
let studentId;
let internshipId;
let applicationId;
let logbookEntryId;
let evaluationId;
let certificateId;
let jobId;
let bookmarkId;

async function runSupertestSuite() {
  console.log('====================================================');
  console.log('🧪 RUNNING SUPERTEST SUITE FOR ALL 51 ENDPOINTS');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}`);
      console.error(`     Reason: ${err.message}`);
      failed++;
    }
  }

  // 1. Health & Landing (2 Endpoints)
  await test('1. GET /api/health', async () => {
    const res = await request(app).get('/api/health');
    if (res.status !== 200 || !res.body.success) throw new Error(`Status ${res.status}`);
  });

  await test('2. GET /api/landing/stats', async () => {
    const res = await request(app).get('/api/landing/stats');
    if (res.status !== 200 || res.body.data.registeredFarmers === undefined) throw new Error(`Status ${res.status}`);
  });

  // 2. Auth Module (7 Endpoints)
  const farmerEmail = `farmer_st_${Date.now()}@jadipetani.com`;
  const studentEmail = `student_st_${Date.now()}@jadipetani.com`;

  await test('3. POST /api/auth/register (FARMER)', async () => {
    const res = await request(app).post('/api/auth/register').send({
      fullName: 'Pak Budi Petani Supertest',
      email: farmerEmail,
      password: 'password123',
      confirmPassword: 'password123',
      role: 'FARMER',
      agreedToTerms: true,
    });
    if (res.status !== 201) throw new Error(`Status ${res.status}: ${res.body.message}`);
    farmerToken = res.body.data.accessToken;
    farmerId = res.body.data.user.id;
  });

  await test('4. POST /api/auth/register (STUDENT)', async () => {
    const res = await request(app).post('/api/auth/register').send({
      fullName: 'Ahmad Pelajar Supertest',
      email: studentEmail,
      password: 'password123',
      confirmPassword: 'password123',
      role: 'STUDENT',
      agreedToTerms: true,
    });
    if (res.status !== 201) throw new Error(`Status ${res.status}: ${res.body.message}`);
    studentToken = res.body.data.accessToken;
    studentId = res.body.data.user.id;
  });

  await test('5. POST /api/auth/login', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: farmerEmail,
      password: 'password123',
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  await test('6. GET /api/auth/me', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${farmerToken}`);
    if (res.status !== 200 || res.body.data.email !== farmerEmail) throw new Error(`Status ${res.status}`);
  });

  await test('7. POST /api/auth/refresh-token', async () => {
    const res = await request(app).post('/api/auth/refresh-token');
    if (res.status !== 401 && res.status !== 200) throw new Error(`Unexpected status ${res.status}`);
  });

  await test('8. POST /api/auth/forgot-password', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ email: farmerEmail });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  await test('9. POST /api/auth/logout', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${farmerToken}`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  // 3. User Profile Module (4 Endpoints)
  await test('10. GET /api/users/profile', async () => {
    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${farmerToken}`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  await test('11. PUT /api/users/profile', async () => {
    const res = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({ phone: '081234567890', institution: 'Poktan Supertest' });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  await test('12. GET /api/users/profile/completion', async () => {
    const res = await request(app)
      .get('/api/users/profile/completion')
      .set('Authorization', `Bearer ${farmerToken}`);
    if (res.status !== 200 || res.body.data.completionPercentage === undefined) throw new Error(`Status ${res.status}`);
  });

  await test('13. PUT /api/users/change-password', async () => {
    const res = await request(app)
      .put('/api/users/change-password')
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({ currentPassword: 'password123', newPassword: 'newpassword123', confirmNewPassword: 'newpassword123' });
    if (res.status !== 200) throw new Error(`Status ${res.status}: ${res.body.message}`);

    const relogin = await request(app).post('/api/auth/login').send({
      email: farmerEmail,
      password: 'newpassword123',
    });
    farmerToken = relogin.body.data.accessToken;
  });

  // 4. Internship & Curriculum Module (8 Endpoints)
  await test('14. POST /api/internships (Create Draft)', async () => {
    const res = await request(app)
      .post('/api/internships')
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({
        title: 'Magang Cabai Organik Supertest',
        commodity: 'Cabai Organik',
        location: 'Garut, Jawa Barat',
        durationMonths: 1,
        quota: 2,
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        facilities: 'Akomodasi',
        description: 'Program magang supertest cabai organik.',
      });
    if (res.status !== 201) throw new Error(`Status ${res.status}: ${res.body.message}`);
    internshipId = res.body.data.id;
  });

  await test('15. PUT /api/internships/:id/curriculum (Create Curriculum)', async () => {
    const res = await request(app)
      .put(`/api/internships/${internshipId}/curriculum`)
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({
        curriculum: [
          {
            weekNumber: 1,
            title: 'Minggu 1: Olah Tanah',
            description: 'Persiapan bedengan cabai',
            activities: [
              { name: 'Penyangkulan', description: 'Gemburkan tanah', weight: 50 },
              { name: 'Pemberian Kompos', description: 'Tabur kompos', weight: 50 },
            ],
          },
        ],
      });
    if (res.status !== 200) throw new Error(`Status ${res.status}: ${res.body.message}`);
  });

  await test('16. GET /api/internships/:id/curriculum (Preview)', async () => {
    const res = await request(app).get(`/api/internships/${internshipId}/curriculum`);
    if (res.status !== 200 || !Array.isArray(res.body.data.curriculum)) throw new Error(`Status ${res.status}`);
  });

  await test('17. PATCH /api/internships/:id/publish', async () => {
    const res = await request(app)
      .patch(`/api/internships/${internshipId}/publish`)
      .set('Authorization', `Bearer ${farmerToken}`);
    if (res.status !== 200) throw new Error(`Status ${res.status}: ${res.body.message}`);
  });

  await test('18. GET /api/internships (Public Listing)', async () => {
    const res = await request(app).get('/api/internships');
    if (res.status !== 200 || !Array.isArray(res.body.data)) throw new Error(`Status ${res.status}`);
  });

  await test('19. GET /api/internships/my (Farmer Owned)', async () => {
    const res = await request(app)
      .get('/api/internships/my')
      .set('Authorization', `Bearer ${farmerToken}`);
    if (res.status !== 200 || res.body.data.length === 0) throw new Error(`Status ${res.status}`);
  });

  await test('20. GET /api/internships/:id (Detail)', async () => {
    const res = await request(app).get(`/api/internships/${internshipId}`);
    if (res.status !== 200 || res.body.data.id !== internshipId) throw new Error(`Status ${res.status}`);
  });

  await test('21. PUT /api/internships/:id (Edit)', async () => {
    const res = await request(app)
      .put(`/api/internships/${internshipId}`)
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({ location: 'Garut Barat, Jawa Barat', status: 'ACTIVE' });
    if (res.status !== 200 || res.body.data.location !== 'Garut Barat, Jawa Barat') throw new Error(`Status ${res.status}`);
  });

  // 5. Applications & Applicant Management (6 Endpoints)
  await test('22. POST /api/internships/:id/apply (Student Apply)', async () => {
    const pdfBuffer = Buffer.from('%PDF-1.4 %PDF Dummy CV Document');
    const res = await request(app)
      .post(`/api/internships/${internshipId}/apply`)
      .set('Authorization', `Bearer ${studentToken}`)
      .field('motivation', 'Saya berminat magang cabai organik.')
      .attach('cv', pdfBuffer, 'cv.pdf');

    if (res.status !== 201) throw new Error(`Status ${res.status}: ${JSON.stringify(res.body)}`);
    applicationId = res.body.data.id;
  });

  await test('23. GET /api/applications/my', async () => {
    const res = await request(app)
      .get('/api/applications/my')
      .set('Authorization', `Bearer ${studentToken}`);
    if (res.status !== 200 || res.body.data.length === 0) throw new Error(`Status ${res.status}`);
  });

  await test('24. GET /api/applications/:id', async () => {
    const res = await request(app)
      .get(`/api/applications/${applicationId}`)
      .set('Authorization', `Bearer ${studentToken}`);
    if (res.status !== 200 || res.body.data.id !== applicationId) throw new Error(`Status ${res.status}`);
  });

  await test('25. GET /api/internships/:id/applicants (Farmer)', async () => {
    const res = await request(app)
      .get(`/api/internships/${internshipId}/applicants`)
      .set('Authorization', `Bearer ${farmerToken}`);
    if (res.status !== 200 || res.body.data.length === 0) throw new Error(`Status ${res.status}`);
  });

  await test('26. PATCH /api/applications/:id/accept (Accept & Auto Create Logbook)', async () => {
    const res = await request(app)
      .patch(`/api/applications/${applicationId}/accept`)
      .set('Authorization', `Bearer ${farmerToken}`);
    if (res.status !== 200) throw new Error(`Status ${res.status}: ${res.body.message}`);
  });

  // 6. My Internships & AI Logbook (3 Endpoints)
  await test('27. GET /api/my-internships', async () => {
    const res = await request(app)
      .get('/api/my-internships')
      .set('Authorization', `Bearer ${studentToken}`);
    if (res.status !== 200 || res.body.data.length === 0) throw new Error(`Status ${res.status}`);
  });

  await test('28. GET /api/my-internships/:id/logbook', async () => {
    const res = await request(app)
      .get(`/api/my-internships/${applicationId}/logbook`)
      .set('Authorization', `Bearer ${studentToken}`);
    if (res.status !== 200 || !Array.isArray(res.body.data.weeks)) throw new Error(`Status ${res.status}`);
    logbookEntryId = res.body.data.weeks[0].id;
  });

  await test('29. PUT /api/my-internships/:id/logbook/week/:weekNumber', async () => {
    const res = await request(app)
      .put(`/api/my-internships/${applicationId}/logbook/week/1`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ reflection: 'Refleksi minggu 1 olah tanah selesai.' });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  // 7. Evaluation & Certificate Module (7 Endpoints)
  await test('30. GET /api/internships/:iId/evaluations/:aId', async () => {
    const res = await request(app)
      .get(`/api/internships/${internshipId}/evaluations/${applicationId}`)
      .set('Authorization', `Bearer ${farmerToken}`);
    if (res.status !== 200 || !Array.isArray(res.body.data.weeks)) throw new Error(`Status ${res.status}`);
    evaluationId = res.body.data.weeks[0].id;
  });

  await test('31. PATCH /api/evaluations/:id/grade', async () => {
    const res = await request(app)
      .patch(`/api/evaluations/${evaluationId}/grade`)
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({ score: 90, notes: 'Sangat baik' });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  await test('32. POST /api/internships/:iId/evaluations/:aId/graduate (Issue Certificate)', async () => {
    const res = await request(app)
      .post(`/api/internships/${internshipId}/evaluations/${applicationId}/graduate`)
      .set('Authorization', `Bearer ${farmerToken}`);
    if (res.status !== 200 && res.status !== 201) throw new Error(`Status ${res.status}: ${res.body.message}`);
    certificateId = res.body.data?.certificate?.id || res.body.data?.id;
    if (!certificateId) throw new Error(`Certificate ID not returned: ${JSON.stringify(res.body)}`);
  });

  await test('33. GET /api/certificates/my', async () => {
    const res = await request(app)
      .get('/api/certificates/my')
      .set('Authorization', `Bearer ${studentToken}`);
    if (res.status !== 200 || res.body.data.length === 0) throw new Error(`Status ${res.status}`);
  });

  await test('34. GET /api/certificates/:id', async () => {
    const res = await request(app)
      .get(`/api/certificates/${certificateId}`)
      .set('Authorization', `Bearer ${studentToken}`);
    if (res.status !== 200 || res.body.data.id !== certificateId) throw new Error(`Status ${res.status}`);
  });

  await test('35. GET /api/certificates/:id/download', async () => {
    const res = await request(app)
      .get(`/api/certificates/${certificateId}/download`)
      .set('Authorization', `Bearer ${studentToken}`);
    if (res.status !== 200 && res.status !== 302) throw new Error(`Status ${res.status}`);
  });

  await test('36. DELETE /api/certificates/:id', async () => {
    const res = await request(app)
      .delete(`/api/certificates/${certificateId}`)
      .set('Authorization', `Bearer ${farmerToken}`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  // 8. Bookmarks Module (3 Endpoints)
  await test('37. POST /api/bookmarks', async () => {
    const res = await request(app)
      .post('/api/bookmarks')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ internshipId });
    if (res.status !== 201) throw new Error(`Status ${res.status}`);
    bookmarkId = res.body.data.id;
  });

  await test('38. GET /api/bookmarks/my', async () => {
    const res = await request(app)
      .get('/api/bookmarks/my')
      .set('Authorization', `Bearer ${studentToken}`);
    if (res.status !== 200 || res.body.data.length === 0) throw new Error(`Status ${res.status}`);
  });

  await test('39. DELETE /api/bookmarks/:id', async () => {
    const res = await request(app)
      .delete(`/api/bookmarks/${bookmarkId}`)
      .set('Authorization', `Bearer ${studentToken}`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  // 9. Dashboard Module (2 Endpoints)
  await test('40. GET /api/dashboard/farmer', async () => {
    const res = await request(app)
      .get('/api/dashboard/farmer')
      .set('Authorization', `Bearer ${farmerToken}`);
    if (res.status !== 200 || res.body.data.activeListings === undefined) throw new Error(`Status ${res.status}`);
  });

  await test('41. GET /api/dashboard/student', async () => {
    const res = await request(app)
      .get('/api/dashboard/student')
      .set('Authorization', `Bearer ${studentToken}`);
    if (res.status !== 200 || res.body.data.activeApplications === undefined) throw new Error(`Status ${res.status}`);
  });

  // 10. Job Connector & Payments Module (7 Endpoints)
  await test('42. POST /api/jobs (Create Job)', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({
        title: 'Manajer Kebun Supertest',
        location: 'Pangalengan, Bandung',
        description: 'Supervisi kebun komersial.',
        qualifications: 'S1 Pertanian, 2 tahun pengalaman.',
        offeredSalary: 6000000,
      });
    if (res.status !== 201 || res.body.data.job.placementFee !== 3000000) throw new Error(`Status ${res.status}`);
    jobId = res.body.data.job.id;
  });

  await test('43. GET /api/jobs/my', async () => {
    const res = await request(app)
      .get('/api/jobs/my')
      .set('Authorization', `Bearer ${farmerToken}`);
    if (res.status !== 200 || res.body.data.length === 0) throw new Error(`Status ${res.status}`);
  });

  await test('44. GET /api/jobs/:id', async () => {
    const res = await request(app)
      .get(`/api/jobs/${jobId}`)
      .set('Authorization', `Bearer ${farmerToken}`);
    if (res.status !== 200 || res.body.data.id !== jobId) throw new Error(`Status ${res.status}`);
  });

  await test('45. PUT /api/jobs/:id', async () => {
    const res = await request(app)
      .put(`/api/jobs/${jobId}`)
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({ location: 'Pangalengan Selatan, Bandung' });
    if (res.status !== 200 || res.body.data.location !== 'Pangalengan Selatan, Bandung') throw new Error(`Status ${res.status}`);
  });

  await test('46. POST /api/jobs/:id/retry-payment', async () => {
    const res = await request(app)
      .post(`/api/jobs/${jobId}/retry-payment`)
      .set('Authorization', `Bearer ${farmerToken}`);
    if (res.status !== 200 && res.status !== 400) throw new Error(`Status ${res.status}`);
  });

  await test('47. POST /api/payments/midtrans/callback (Simulated Webhook)', async () => {
    const res = await request(app)
      .post('/api/payments/midtrans/callback')
      .send({
        order_id: 'NON_EXISTENT_ORDER_9999',
        status_code: '200',
        gross_amount: '3000000.00',
        signature_key: 'invalid_sig',
        transaction_status: 'settlement',
      });
    if (res.status !== 401 && res.status !== 200) throw new Error(`Unexpected status ${res.status}`);
  });

  await test('48. DELETE /api/jobs/:id', async () => {
    const res = await request(app)
      .delete(`/api/jobs/${jobId}`)
      .set('Authorization', `Bearer ${farmerToken}`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  // Cleanup & Account Deletion (3 Endpoints)
  await test('49. DELETE /api/internships/:id/curriculum', async () => {
    const res = await request(app)
      .delete(`/api/internships/${internshipId}/curriculum`)
      .set('Authorization', `Bearer ${farmerToken}`);
    if (res.status !== 200 && res.status !== 400) throw new Error(`Status ${res.status}`);
  });

  await test('50. DELETE /api/internships/:id', async () => {
    const res = await request(app)
      .delete(`/api/internships/${internshipId}`)
      .set('Authorization', `Bearer ${farmerToken}`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  await test('51. DELETE /api/users/me (Delete Account)', async () => {
    const res = await request(app)
      .delete('/api/users/me')
      .set('Authorization', `Bearer ${studentToken}`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  console.log('\n====================================================');
  console.log(`📊 FINAL TEST SUMMARY FOR ALL 51 ENDPOINTS:`);
  console.log(`   Total Endpoints Tested: ${passed + failed}`);
  console.log(`   Passed:                 ${passed}`);
  console.log(`   Failed:                 ${failed}`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSupertestSuite();
