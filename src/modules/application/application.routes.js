const router = require('express').Router();
const auth = require('../../middlewares/auth');
const authorize = require('../../middlewares/authorize');
const { uploadApplication } = require('../../middlewares/upload');
const { success } = require('../../utils/apiResponse');
const { paginate, paginationMeta } = require('../../utils/pagination');
const prisma = require('../../config/database');
const ApiError = require('../../utils/apiError');
const { uploadToSupabase, getSignedUrl } = require('../../utils/fileUpload');
const { sendEmail, applicationAcceptedEmail, applicationRejectedEmail } = require('../../utils/emailService');
const { MAX_ACTIVE_APPLICATIONS, MAX_MOTIVATION_LENGTH } = require('../../utils/constants');

// POST /api/internships/:id/apply — Apply magang
router.post('/:id/apply', auth, authorize('STUDENT'), uploadApplication, async (req, res, next) => {
  try {
    const internshipId = req.params.id;
    const studentId = req.user.id;

    // Validate internship exists and is active
    const internship = await prisma.internship.findFirst({
      where: { id: internshipId, status: 'ACTIVE', deletedAt: null },
    });
    if (!internship) throw ApiError.badRequest('Lowongan tidak aktif atau tidak ditemukan');
    if (new Date() > internship.deadline) throw ApiError.badRequest('Deadline pendaftaran sudah terlewati');

    // Check duplicate application
    const existing = await prisma.application.findUnique({
      where: { studentId_internshipId: { studentId, internshipId } },
    });
    if (existing) throw ApiError.badRequest('Anda sudah melamar ke lowongan ini');

    // Check max active applications
    const activeCount = await prisma.application.count({
      where: { studentId, status: 'REVIEW', type: 'INTERNSHIP' },
    });
    if (activeCount >= MAX_ACTIVE_APPLICATIONS) {
      throw ApiError.badRequest(`Anda sudah memiliki ${MAX_ACTIVE_APPLICATIONS} lamaran aktif. Tunggu respons dari lowongan yang sudah dilamar.`);
    }

    // Validate files
    if (!req.files?.cv?.[0]) throw ApiError.badRequest('CV wajib diupload');
    const motivation = req.body.motivation;
    if (!motivation || motivation.length > MAX_MOTIVATION_LENGTH) {
      throw ApiError.badRequest(`Motivasi wajib diisi (maksimal ${MAX_MOTIVATION_LENGTH} karakter)`);
    }

    // Upload CV
    const cvFile = req.files.cv[0];
    const cvResult = await uploadToSupabase(cvFile.buffer, cvFile.originalname, 'cv', studentId);

    // Upload portfolio (optional)
    let portfolioResult = null;
    if (req.files?.portfolio?.[0]) {
      const portfolioFile = req.files.portfolio[0];
      portfolioResult = await uploadToSupabase(portfolioFile.buffer, portfolioFile.originalname, 'portfolios', studentId);
    }

    // Create application
    const application = await prisma.application.create({
      data: {
        type: 'INTERNSHIP',
        studentId,
        internshipId,
        cvUrl: cvResult.url,
        cvPath: cvResult.filePath,
        portfolioUrl: portfolioResult?.url || null,
        portfolioPath: portfolioResult?.filePath || null,
        motivation,
        status: 'REVIEW',
      },
    });

    return success(res, {
      statusCode: 201,
      message: 'Lamaran berhasil dikirim',
      data: application,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/internships/:id/applicants — List pendaftar
router.get('/:id/applicants', auth, authorize('FARMER'), async (req, res, next) => {
  try {
    const internship = await prisma.internship.findFirst({
      where: { id: req.params.id, userId: req.user.id, deletedAt: null },
    });
    if (!internship) throw ApiError.notFound('Lowongan tidak ditemukan');

    const { page, limit, skip } = paginate(req.query);
    const where = { internshipId: req.params.id, type: 'INTERNSHIP' };

    if (req.query.status) where.status = req.query.status;
    if (req.query.search) {
      where.student = { fullName: { contains: req.query.search, mode: 'insensitive' } };
    }

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, status: true, createdAt: true,
          student: { select: { id: true, fullName: true, institution: true } },
        },
      }),
      prisma.application.count({ where }),
    ]);

    return success(res, {
      data: applications,
      meta: { ...paginationMeta(total, page, limit), quota: internship.quota, acceptedCount: internship.acceptedCount },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
