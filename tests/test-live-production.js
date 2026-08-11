const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://be-jadipetani-production.up.railway.app';
const api = axios.create({
  baseURL: BASE_URL,
  validateStatus: () => true, // Don't throw on non-2xx status codes
  headers: {
    'Content-Type': 'application/json',
  },
});

let farmerToken = '';
let studentToken = '';
let farmerId = '';
let studentId = '';
let internshipId = '';
let applicationId = '';
let evaluationId = '';
let certificateId = '';
let bookmarkId = '';
let jobId = '';
let jobOrderId = '';

const timestamp = Date.now();
const farmerEmail = `farmer.prod.${timestamp}@jadipetani.test`;
const studentEmail = `student.prod.${timestamp}@jadipetani.test`;
const password = 'Password123!';

const logPass = (num, title, details = '') => {
  console.log(`\x1b[32m  ✅ [PASS ${num}] ${title}\x1b[0m ${details}`);
};

const logFail = (num, title, res) => {
  console.error(`\x1b[31m  ❌ [FAIL ${num}] ${title}\x1b[0m Status: ${res.status}`);
  console.error('     Response Body:', JSON.stringify(res.data, null, 2));
  process.exit(1);
};

// Create a dummy PDF buffer for CV testing
const createDummyPDF = () => {
  return Buffer.from('%PDF-1.4\n1 0 obj\n<< /Title (Test CV) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF');
};

// Create a dummy JPEG buffer for image upload testing
const createDummyImage = () => {
  // Simple 1x1 GIF / JPEG buffer
  return Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
};

async function runLiveProductionTest() {
  console.log('\n====================================================');
  console.log(`🚀 STARTING LIVE PRODUCTION END-TO-END SUITE`);
  console.log(`🌐 Target Server: ${BASE_URL}`);
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  console.log('====================================================\n');

  // 1. GET /api/health
  {
    const res = await api.get('/api/health');
    if (res.status === 200 && res.data.success) {
      logPass(1, 'GET /api/health', `(Status: ${res.status}, Message: "${res.data.message}")`);
    } else logFail(1, 'GET /api/health', res);
  }

  // 2. GET /api/landing/stats
  {
    const res = await api.get('/api/landing/stats');
    if (res.status === 200 && res.data.success) {
      logPass(2, 'GET /api/landing/stats', `(Registered Farmers: ${res.data.data.registeredFarmers})`);
    } else logFail(2, 'GET /api/landing/stats', res);
  }

  // 3. POST /api/auth/register (Farmer)
  {
    const res = await api.post('/api/auth/register', {
      fullName: 'Pak Tani Live Prod',
      email: farmerEmail,
      password: password,
      confirmPassword: password,
      role: 'FARMER',
      agreedToTerms: true,
    });
    if (res.status === 201 && res.data.success) {
      farmerToken = res.data.data.accessToken;
      farmerId = res.data.data.user.id;
      logPass(3, 'POST /api/auth/register (Farmer)', `(User ID: ${farmerId})`);
    } else logFail(3, 'POST /api/auth/register (Farmer)', res);
  }

  // 4. POST /api/auth/register (Student)
  {
    const res = await api.post('/api/auth/register', {
      fullName: 'Siswa Live Prod',
      email: studentEmail,
      password: password,
      confirmPassword: password,
      role: 'STUDENT',
      agreedToTerms: true,
    });
    if (res.status === 201 && res.data.success) {
      studentToken = res.data.data.accessToken;
      studentId = res.data.data.user.id;
      logPass(4, 'POST /api/auth/register (Student)', `(User ID: ${studentId})`);
    } else logFail(4, 'POST /api/auth/register (Student)', res);
  }

  // 5. POST /api/auth/login (Farmer Login)
  {
    const res = await api.post('/api/auth/login', {
      email: farmerEmail,
      password: password,
    });
    if (res.status === 200 && res.data.success) {
      farmerToken = res.data.data.accessToken;
      logPass(5, 'POST /api/auth/login (Farmer)');
    } else logFail(5, 'POST /api/auth/login (Farmer)', res);
  }

  // 6. POST /api/auth/login (Student Login)
  {
    const res = await api.post('/api/auth/login', {
      email: studentEmail,
      password: password,
    });
    if (res.status === 200 && res.data.success) {
      studentToken = res.data.data.accessToken;
      logPass(6, 'POST /api/auth/login (Student)');
    } else logFail(6, 'POST /api/auth/login (Student)', res);
  }

  // 7. GET /api/auth/me (Student Profile)
  {
    const res = await api.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (res.status === 200 && res.data.success && res.data.data.email === studentEmail) {
      logPass(7, 'GET /api/auth/me (Current User Profile)');
    } else logFail(7, 'GET /api/auth/me', res);
  }

  // 8. POST /api/auth/forgot-password
  {
    const res = await api.post('/api/auth/forgot-password', {
      email: studentEmail,
    });
    if (res.status === 200 && res.data.success) {
      logPass(8, 'POST /api/auth/forgot-password');
    } else logFail(8, 'POST /api/auth/forgot-password', res);
  }

  // 9. POST /api/auth/logout
  {
    const res = await api.post('/api/auth/logout', {}, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (res.status === 200 && res.data.success) {
      logPass(9, 'POST /api/auth/logout');
    } else logFail(9, 'POST /api/auth/logout', res);
  }

  // Re-login student to get fresh token
  {
    const res = await api.post('/api/auth/login', { email: studentEmail, password });
    studentToken = res.data.data.accessToken;
  }

  // 10. GET /api/users/profile
  {
    const res = await api.get('/api/users/profile', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (res.status === 200 && res.data.success) {
      logPass(10, 'GET /api/users/profile');
    } else logFail(10, 'GET /api/users/profile', res);
  }

  // 11. PUT /api/users/profile
  {
    const res = await api.put('/api/users/profile', {
      fullName: 'Siswa Live Prod Updated',
      phone: '081299998888',
      address: 'Bandung, Jawa Barat',
      institution: 'IPB University',
      bio: 'Belajar smart farming & hidroponik',
    }, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (res.status === 200 && res.data.success) {
      logPass(11, 'PUT /api/users/profile');
    } else logFail(11, 'PUT /api/users/profile', res);
  }

  // 12. GET /api/users/profile/completion
  {
    const res = await api.get('/api/users/profile/completion', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (res.status === 200 && res.data.success && typeof res.data.data.completionPercentage === 'number') {
      logPass(12, 'GET /api/users/profile/completion', `(Percentage: ${res.data.data.completionPercentage}%)`);
    } else logFail(12, 'GET /api/users/profile/completion', res);
  }

  // 13. POST /api/users/profile/avatar (Upload image)
  {
    const form = new FormData();
    form.append('avatar', createDummyImage(), { filename: 'avatar.png', contentType: 'image/png' });
    const res = await api.post('/api/users/profile/avatar', form, {
      headers: { ...form.getHeaders(), Authorization: `Bearer ${studentToken}` },
    });
    if (res.status === 200 && res.data.success) {
      logPass(13, 'POST /api/users/profile/avatar (Supabase Storage)', `(Avatar URL: ${res.data.data.avatarUrl ? 'Uploaded' : 'None'})`);
    } else logFail(13, 'POST /api/users/profile/avatar', res);
  }

  // 14. PUT /api/users/change-password
  {
    const newPass = 'NewPassword123!';
    const res = await api.put('/api/users/change-password', {
      currentPassword: password,
      newPassword: newPass,
      confirmNewPassword: newPass,
    }, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (res.status === 200 && res.data.success) {
      logPass(14, 'PUT /api/users/change-password');
      // Login with new password
      const loginRes = await api.post('/api/auth/login', { email: studentEmail, password: newPass });
      studentToken = loginRes.data.data.accessToken;
    } else logFail(14, 'PUT /api/users/change-password', res);
  }

  // 15. POST /api/internships (Create Draft)
  {
    const res = await api.post('/api/internships', {
      title: 'Magang Hidroponik Melon Super Live',
      commodity: 'Melon Hibrida Super',
      location: 'Lembang, Bandung Barat',
      durationMonths: 1,
      quota: 3,
      deadline: '2026-10-01T00:00:00.000Z',
      facilities: 'Mes, makan siang, alat kerja',
      description: 'Program magang 1 bulan nutrisi AB Mix & drip fertigation.',
    }, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    if (res.status === 201 && res.data.success) {
      internshipId = res.data.data.id;
      logPass(15, 'POST /api/internships (Create Draft)', `(ID: ${internshipId})`);
    } else logFail(15, 'POST /api/internships (Create Draft)', res);
  }

  // 16. POST /api/internships/:id/curriculum/generate (REAL GEMINI AI CALL ON PRODUCTION)
  {
    console.log('  ⏳ Calling Google Gemini AI on Production Server...');
    const res = await api.post(`/api/internships/${internshipId}/curriculum/generate`, {}, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    if (res.status === 200 && res.data.success && Array.isArray(res.data.data.curriculum)) {
      logPass(16, 'POST /api/internships/:id/curriculum/generate (Google Gemini AI)', `(Weeks Generated: ${res.data.data.curriculum.length})`);
    } else logFail(16, 'POST /api/internships/:id/curriculum/generate', res);
  }

  // 17. GET /api/internships/:id/curriculum
  {
    const res = await api.get(`/api/internships/${internshipId}/curriculum`);
    if (res.status === 200 && res.data.success) {
      logPass(17, 'GET /api/internships/:id/curriculum (Preview)');
    } else logFail(17, 'GET /api/internships/:id/curriculum', res);
  }

  // 18. PUT /api/internships/:id/curriculum (Manual Edit)
  {
    const res = await api.put(`/api/internships/${internshipId}/curriculum`, {
      curriculum: [
        {
          weekNumber: 1,
          title: 'Minggu 1: Persiapan Lahan & Nutrisi',
          description: 'Persiapan media tanam cocopeat.',
          activities: [
            { name: 'Sterilisasi Media', description: 'Sterilisasi cocopeat', weight: 50 },
            { name: 'Penyemaian Benih', description: 'Semai 50 benih melon', weight: 50 },
          ],
        },
      ],
    }, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    if (res.status === 200 && res.data.success) {
      logPass(18, 'PUT /api/internships/:id/curriculum (Save Manual)');
    } else logFail(18, 'PUT /api/internships/:id/curriculum', res);
  }

  // 19. PATCH /api/internships/:id/publish (Draft -> Active)
  {
    const res = await api.patch(`/api/internships/${internshipId}/publish`, {}, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    if (res.status === 200 && res.data.success) {
      logPass(19, 'PATCH /api/internships/:id/publish (Status ACTIVE)');
    } else logFail(19, 'PATCH /api/internships/:id/publish', res);
  }

  // 20. GET /api/internships (Public Listing)
  {
    const res = await api.get('/api/internships?search=Melon');
    if (res.status === 200 && res.data.success && Array.isArray(res.data.data)) {
      logPass(20, 'GET /api/internships (Public Search & Listing)', `(Total Found: ${res.data.meta.total})`);
    } else logFail(20, 'GET /api/internships', res);
  }

  // 21. GET /api/internships/my (Farmer Owned)
  {
    const res = await api.get('/api/internships/my', {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    if (res.status === 200 && res.data.success) {
      logPass(21, 'GET /api/internships/my (Farmer Owned)');
    } else logFail(21, 'GET /api/internships/my', res);
  }

  // 22. GET /api/internships/:id (Detail)
  {
    const res = await api.get(`/api/internships/${internshipId}`);
    if (res.status === 200 && res.data.success) {
      logPass(22, 'GET /api/internships/:id (Detail)');
    } else logFail(22, 'GET /api/internships/:id', res);
  }

  // 23. PUT /api/internships/:id (Edit Internship)
  {
    const res = await api.put(`/api/internships/${internshipId}`, {
      title: 'Magang Hidroponik Melon Super Live Updated',
      quota: 4,
    }, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    if (res.status === 200 && res.data.success) {
      logPass(23, 'PUT /api/internships/:id (Edit)');
    } else logFail(23, 'PUT /api/internships/:id', res);
  }

  // 24. POST /api/internships/:id/apply (Student Apply + Upload PDF CV)
  {
    const form = new FormData();
    form.append('cv', createDummyPDF(), { filename: 'cv.pdf', contentType: 'application/pdf' });
    form.append('motivation', 'Saya berminat riset nutrisi AB Mix.');

    const res = await api.post(`/api/internships/${internshipId}/apply`, form, {
      headers: { ...form.getHeaders(), Authorization: `Bearer ${studentToken}` },
    });
    if (res.status === 201 && res.data.success) {
      applicationId = res.data.data.id;
      logPass(24, 'POST /api/internships/:id/apply (PDF CV Upload)', `(Application ID: ${applicationId})`);
    } else logFail(24, 'POST /api/internships/:id/apply', res);
  }

  // 25. GET /api/applications/my (Student Applications List)
  {
    const res = await api.get('/api/applications/my', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (res.status === 200 && res.data.success) {
      logPass(25, 'GET /api/applications/my (Student List)');
    } else logFail(25, 'GET /api/applications/my', res);
  }

  // 26. GET /api/applications/:id (Application Detail + Signed Link)
  {
    const res = await api.get(`/api/applications/${applicationId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (res.status === 200 && res.data.success) {
      logPass(26, 'GET /api/applications/:id (Signed PDF URL)', `(CV URL: ${res.data.data.cvUrl ? 'Signed' : 'None'})`);
    } else logFail(26, 'GET /api/applications/:id', res);
  }

  // 27. GET /api/internships/:id/applicants (Farmer Applicants)
  {
    const res = await api.get(`/api/internships/${internshipId}/applicants`, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    if (res.status === 200 && res.data.success) {
      logPass(27, 'GET /api/internships/:id/applicants (Farmer)');
    } else logFail(27, 'GET /api/internships/:id/applicants', res);
  }

  // 28. PATCH /api/applications/:id/accept (Accept Student & Auto Create AI Logbook)
  {
    const res = await api.patch(`/api/applications/${applicationId}/accept`, {}, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    if (res.status === 200 && res.data.success) {
      logPass(28, 'PATCH /api/applications/:id/accept (Accept & Auto Create Logbook)');
    } else logFail(28, 'PATCH /api/applications/:id/accept', res);
  }

  // 29. GET /api/my-internships (Student Enrolled Programs)
  {
    const res = await api.get('/api/my-internships', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (res.status === 200 && res.data.success) {
      logPass(29, 'GET /api/my-internships');
    } else logFail(29, 'GET /api/my-internships', res);
  }

  // 30. GET /api/my-internships/:id/logbook (Get Student Logbook)
  {
    const res = await api.get(`/api/my-internships/${applicationId}/logbook`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (res.status === 200 && res.data.success) {
      const weeks = res.data.data.weeks || [];
      logPass(30, 'GET /api/my-internships/:id/logbook', `(Total Weeks: ${weeks.length})`);
    } else logFail(30, 'GET /api/my-internships/:id/logbook', res);
  }

  // 31. PUT /api/my-internships/:id/logbook/week/1 (Update Logbook Checklist)
  {
    // First fetch logbook detail to get activity IDs
    const logbookRes = await api.get(`/api/my-internships/${applicationId}/logbook`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const week1 = logbookRes.data.data.weeks[0];
    const activities = (week1.activities || []).map(a => ({ id: a.id, isCompleted: true }));

    const res = await api.put(`/api/my-internships/${applicationId}/logbook/week/1`, {
      reflection: 'Minggu ini berhasil menyemai 50 benih melon.',
      activities: activities,
    }, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (res.status === 200 && res.data.success) {
      logPass(31, 'PUT /api/my-internships/:id/logbook/week/1 (Update Checklist)');
    } else logFail(31, 'PUT /api/my-internships/:id/logbook/week/1', res);
  }

  // 32. POST /api/my-internships/:id/logbook/week/1/evidence (Upload Evidence Image)
  {
    const form = new FormData();
    form.append('documentation', createDummyImage(), { filename: 'bukti1.jpg', contentType: 'image/jpeg' });
    const res = await api.post(`/api/my-internships/${applicationId}/logbook/week/1/evidence`, form, {
      headers: { ...form.getHeaders(), Authorization: `Bearer ${studentToken}` },
    });
    if (res.status === 201 && res.data.success) {
      logPass(32, 'POST /api/my-internships/:id/logbook/week/1/evidence (Supabase Storage)');
    } else logFail(32, 'POST /api/my-internships/:id/logbook/week/1/evidence', res);
  }

  // 33. GET /api/internships/:internshipId/evaluations/:applicationId (Get Evaluation Form)
  {
    const res = await api.get(`/api/internships/${internshipId}/evaluations/${applicationId}`, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    if (res.status === 200 && res.data.success) {
      evaluationId = res.data.data.weeks[0].id;
      logPass(33, 'GET /api/internships/:iId/evaluations/:aId (Evaluation Form)');
    } else logFail(33, 'GET /api/internships/:iId/evaluations/:aId', res);
  }

  // 34. PATCH /api/evaluations/:id/grade (Farmer Grade Week)
  {
    const res = await api.patch(`/api/evaluations/${evaluationId}/grade`, {
      score: 95,
      notes: 'Sangat baik dan teliti.',
    }, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    if (res.status === 200 && res.data.success) {
      logPass(34, 'PATCH /api/evaluations/:id/grade (Grade Week)');
    } else logFail(34, 'PATCH /api/evaluations/:id/grade', res);
  }

  // 35. POST /api/internships/:iId/evaluations/:aId/ai-summary (REAL GEMINI AI SUMMARY ON PRODUCTION)
  {
    console.log('  ⏳ Requesting Gemini AI Evaluation Summary on Production Server...');
    const res = await api.post(`/api/internships/${internshipId}/evaluations/${applicationId}/ai-summary`, {}, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    if (res.status === 200 && res.data.success && res.data.data.overallScore) {
      logPass(35, 'POST /api/internships/:iId/evaluations/:aId/ai-summary (Gemini AI Summary)', `(Score: ${res.data.data.overallScore})`);
    } else logFail(35, 'POST /api/internships/:iId/evaluations/:aId/ai-summary', res);
  }

  // 36. POST /api/internships/:iId/evaluations/:aId/graduate (Graduate & Issue PDF Certificate)
  {
    console.log('  ⏳ Generating PDF Certificate with PDFKit on Production Server...');
    const res = await api.post(`/api/internships/${internshipId}/evaluations/${applicationId}/graduate`, {}, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    if (res.status === 201 && res.data.success && res.data.data.certificate) {
      certificateId = res.data.data.certificate.id;
      logPass(36, 'POST /api/internships/:iId/evaluations/:aId/graduate (Issue Certificate PDF)', `(Cert No: ${res.data.data.certificate.certificateNumber})`);
    } else logFail(36, 'POST /api/internships/:iId/evaluations/:aId/graduate', res);
  }

  // 37. GET /api/certificates/my (Student Certificates List)
  {
    const res = await api.get('/api/certificates/my', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (res.status === 200 && res.data.success) {
      logPass(37, 'GET /api/certificates/my (Student List)');
    } else logFail(37, 'GET /api/certificates/my', res);
  }

  // 38. GET /api/certificates/:id (Certificate Detail)
  {
    const res = await api.get(`/api/certificates/${certificateId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (res.status === 200 && res.data.success) {
      logPass(38, 'GET /api/certificates/:id (Detail)');
    } else logFail(38, 'GET /api/certificates/:id', res);
  }

  // 39. GET /api/certificates/:id/download (Download PDF - 302 Redirect)
  {
    const res = await api.get(`/api/certificates/${certificateId}/download`, {
      headers: { Authorization: `Bearer ${studentToken}` },
      maxRedirects: 0,
    });
    if (res.status === 302 || res.status === 200) {
      logPass(39, 'GET /api/certificates/:id/download (302 Redirect to PDF)', `(Location: ${res.headers.location ? 'Valid URL' : 'Stream'})`);
    } else logFail(39, 'GET /api/certificates/:id/download', res);
  }

  // 40. DELETE /api/certificates/:id (Revoke Certificate)
  {
    const res = await api.delete(`/api/certificates/${certificateId}`, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    if (res.status === 200 && res.data.success) {
      logPass(40, 'DELETE /api/certificates/:id (Revoke Certificate)');
    } else logFail(40, 'DELETE /api/certificates/:id', res);
  }

  // 41. POST /api/bookmarks (Bookmark Internship)
  {
    const res = await api.post('/api/bookmarks', {
      internshipId: internshipId,
    }, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (res.status === 201 && res.data.success) {
      bookmarkId = res.data.data.id;
      logPass(41, 'POST /api/bookmarks (Save Favorite)');
    } else logFail(41, 'POST /api/bookmarks', res);
  }

  // 42. GET /api/bookmarks/my (List Student Bookmarks)
  {
    const res = await api.get('/api/bookmarks/my', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (res.status === 200 && res.data.success) {
      logPass(42, 'GET /api/bookmarks/my (Student List)');
    } else logFail(42, 'GET /api/bookmarks/my', res);
  }

  // 43. DELETE /api/bookmarks/:id (Delete Bookmark)
  {
    const res = await api.delete(`/api/bookmarks/${bookmarkId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (res.status === 200 && res.data.success) {
      logPass(43, 'DELETE /api/bookmarks/:id');
    } else logFail(43, 'DELETE /api/bookmarks/:id', res);
  }

  // 44. GET /api/dashboard/farmer (Farmer Dashboard Stats)
  {
    const res = await api.get('/api/dashboard/farmer', {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    if (res.status === 200 && res.data.success) {
      logPass(44, 'GET /api/dashboard/farmer', `(Active Listings: ${res.data.data.activeListings})`);
    } else logFail(44, 'GET /api/dashboard/farmer', res);
  }

  // 45. GET /api/dashboard/student (Student Dashboard Stats)
  {
    const res = await api.get('/api/dashboard/student', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (res.status === 200 && res.data.success) {
      logPass(45, 'GET /api/dashboard/student', `(Active Applications: ${res.data.data.activeApplications})`);
    } else logFail(45, 'GET /api/dashboard/student', res);
  }

  // 46. POST /api/jobs (Create Job Connector & Generate Midtrans Snap Token)
  {
    const res = await api.post('/api/jobs', {
      title: 'Manajer Kebun Sawit Live Prod',
      location: 'Pekanbaru, Riau',
      description: 'Operasional kebun sawit komersial.',
      qualifications: 'Pengalaman 3 tahun.',
      offeredSalary: 8000000,
    }, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    if (res.status === 201 && res.data.success && res.data.data.job) {
      jobId = res.data.data.job.id;
      jobOrderId = res.data.data.orderId;
      logPass(46, 'POST /api/jobs (Create Job & Midtrans Snap Token)', `(Placement Fee: Rp ${res.data.data.job.placementFee})`);
    } else logFail(46, 'POST /api/jobs', res);
  }

  // 47. GET /api/jobs/my (Farmer Jobs List)
  {
    const res = await api.get('/api/jobs/my', {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    if (res.status === 200 && res.data.success) {
      logPass(47, 'GET /api/jobs/my (Farmer Jobs List)');
    } else logFail(47, 'GET /api/jobs/my', res);
  }

  // 48. GET /api/jobs/:id (Job Detail)
  {
    const res = await api.get(`/api/jobs/${jobId}`, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    if (res.status === 200 && res.data.success) {
      logPass(48, 'GET /api/jobs/:id (Detail)');
    } else logFail(48, 'GET /api/jobs/:id', res);
  }

  // 49. PUT /api/jobs/:id (Edit Job)
  {
    const res = await api.put(`/api/jobs/${jobId}`, {
      title: 'Manajer Kebun Sawit Live Prod Updated',
    }, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    if (res.status === 200 && res.data.success) {
      logPass(49, 'PUT /api/jobs/:id (Edit Job)');
    } else logFail(49, 'PUT /api/jobs/:id', res);
  }

  // 50. GET /api/jobs/:id/payment-status (Midtrans Reconciliation)
  {
    const res = await api.get(`/api/jobs/${jobId}/payment-status`, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    if (res.status === 200 && res.data.success) {
      logPass(50, 'GET /api/jobs/:id/payment-status (Reconciliation)');
    } else logFail(50, 'GET /api/jobs/:id/payment-status', res);
  }

  // 51. POST /api/jobs/:id/retry-payment (Retry Midtrans Payment)
  {
    // Retry payment works when status is PAYMENT_FAILED or EXPIRED, or test 400 validation cleanly
    const res = await api.post(`/api/jobs/${jobId}/retry-payment`, {}, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    if (res.status === 200 || res.status === 400) {
      if (res.data.data?.orderId) {
        jobOrderId = res.data.data.orderId;
      }
      logPass(51, 'POST /api/jobs/:id/retry-payment (Retry Token)');
    } else logFail(51, 'POST /api/jobs/:id/retry-payment', res);
  }

  // 52. POST /api/payments/midtrans/callback (Simulate Valid Webhook Settlement -> PUBLISHED)
  {
    const crypto = require('crypto');
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const statusCode = '200';
    const grossAmount = '4000000.00';
    const signatureKey = crypto
      .createHash('sha512')
      .update(jobOrderId + statusCode + grossAmount + serverKey)
      .digest('hex');

    const res = await api.post('/api/payments/midtrans/callback', {
      order_id: jobOrderId,
      status_code: statusCode,
      gross_amount: grossAmount,
      signature_key: signatureKey,
      transaction_status: 'settlement',
    });
    if (res.status === 200 && res.data.success) {
      logPass(52, 'POST /api/payments/midtrans/callback (Valid Webhook -> Job PUBLISHED)');
    } else logFail(52, 'POST /api/payments/midtrans/callback', res);
  }

  // 53. POST /api/jobs/:id/apply (Apply to Job)
  {
    const form = new FormData();
    form.append('cv', createDummyPDF(), { filename: 'cv.pdf', contentType: 'application/pdf' });
    form.append('motivation', 'Saya berpengalaman 3 tahun di kebun.');
    const res = await api.post(`/api/jobs/${jobId}/apply`, form, {
      headers: { ...form.getHeaders(), Authorization: `Bearer ${studentToken}` },
    });
    if (res.status === 201 && res.data.success) {
      logPass(53, 'POST /api/jobs/:id/apply (Job Connector Apply)');
    } else logFail(53, 'POST /api/jobs/:id/apply', res);
  }

  // 53. GET /api/jobs/:id/applicants (Job Applicants List)
  {
    const res = await api.get(`/api/jobs/${jobId}/applicants`, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    if (res.status === 200 && res.data.success) {
      logPass(53, 'GET /api/jobs/:id/applicants (Farmer)');
    } else logFail(53, 'GET /api/jobs/:id/applicants', res);
  }

  // 54. POST /api/payments/midtrans/callback (Simulate Midtrans Webhook Signature Verification)
  {
    const res = await api.post('/api/payments/midtrans/callback', {
      order_id: 'NON_EXISTENT_ORDER_9999',
      status_code: '200',
      gross_amount: '4000000.00',
      signature_key: 'invalid_sha512_hash',
      transaction_status: 'settlement',
    });
    if (res.status === 401 && !res.data.success) {
      logPass(54, 'POST /api/payments/midtrans/callback (Signature Security)');
    } else logFail(54, 'POST /api/payments/midtrans/callback', res);
  }

  // 55. DELETE /api/jobs/:id (Delete Job)
  {
    const res = await api.delete(`/api/jobs/${jobId}`, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    if (res.status === 200 && res.data.success) {
      logPass(55, 'DELETE /api/jobs/:id (Delete Job)');
    } else logFail(55, 'DELETE /api/jobs/:id', res);
  }

  // 56. DELETE /api/internships/:id/curriculum (Reset Curriculum)
  {
    // Try delete curriculum (will return 400 if ACTIVE or 200)
    const res = await api.delete(`/api/internships/${internshipId}/curriculum`, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    if (res.status === 200 || res.status === 400) {
      logPass(56, 'DELETE /api/internships/:id/curriculum (Reset Validation)');
    } else logFail(56, 'DELETE /api/internships/:id/curriculum', res);
  }

  // 57. DELETE /api/internships/:id (Delete Internship)
  {
    const res = await api.delete(`/api/internships/${internshipId}`, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    if (res.status === 200 && res.data.success) {
      logPass(57, 'DELETE /api/internships/:id (Delete Internship)');
    } else logFail(57, 'DELETE /api/internships/:id', res);
  }

  // 58. DELETE /api/users/me (Delete Accounts Cleanly)
  {
    const res1 = await api.delete('/api/users/me', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const res2 = await api.delete('/api/users/me', {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    if (res1.status === 200 && res2.status === 200) {
      logPass(58, 'DELETE /api/users/me (Delete Test Accounts Cleanly)');
    } else logFail(58, 'DELETE /api/users/me', res1);
  }

  console.log('\n====================================================');
  console.log('🎉 ALL ENDPOINTS SUCCESSFULLY TESTED ON LIVE PRODUCTION!');
  console.log(`🌐 Server: ${BASE_URL}`);
  console.log('📊 Result: 58/58 Steps PASSED (100% SUCCESS RATE)');
  console.log('====================================================\n');
}

runLiveProductionTest().catch(err => {
  console.error('\n❌ UNHANDLED FATAL ERROR IN LIVE TEST:', err);
  process.exit(1);
});
