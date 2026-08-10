const router = require('express').Router();
const auth = require('../../middlewares/auth');
const authorize = require('../../middlewares/authorize');
const validate = require('../../middlewares/validate');
const { success } = require('../../utils/apiResponse');
const { paginate, paginationMeta } = require('../../utils/pagination');
const { WEEKS_PER_MONTH } = require('../../utils/constants');
const prisma = require('../../config/database');
const ApiError = require('../../utils/apiError');
const { z } = require('zod');
const { sendEmail, internshipCancelledEmail } = require('../../utils/emailService');

// === Zod Schemas ===
const createInternshipSchema = z.object({
  title: z.string().trim().min(5, 'Judul minimal 5 karakter').max(200),
  commodity: z.string().trim().min(2).max(100),
  location: z.string().trim().min(5).max(300),
  durationMonths: z.coerce.number().int().min(1).max(12),
  quota: z.coerce.number().int().min(1).max(100),
  deadline: z.string().datetime({ message: 'Format tanggal tidak valid (ISO 8601)' }),
  facilities: z.string().trim().max(1000).optional(),
  description: z.string().trim().min(10).max(5000),
  status: z.enum(['DRAFT', 'ACTIVE']).optional().default('DRAFT'),
});

const updateInternshipSchema = createInternshipSchema.partial();

// === Routes ===

// GET /api/internships/my — lowongan milik petani
router.get('/my', auth, authorize('FARMER'), async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const where = { userId: req.user.id, deletedAt: null };
    if (req.query.status) where.status = req.query.status;

    const [internships, total] = await Promise.all([
      prisma.internship.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { applications: true } } },
      }),
      prisma.internship.count({ where }),
    ]);

    return success(res, {
      data: internships,
      meta: paginationMeta(total, page, limit),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/internships — buat lowongan magang
router.post('/', auth, authorize('FARMER'), validate(createInternshipSchema), async (req, res, next) => {
  try {
    const durationWeeks = req.body.durationMonths * WEEKS_PER_MONTH;

    const internship = await prisma.internship.create({
      data: {
        ...req.body,
        durationWeeks,
        deadline: new Date(req.body.deadline),
        userId: req.user.id,
      },
    });

    return success(res, {
      statusCode: 201,
      message: 'Lowongan magang berhasil dibuat',
      data: internship,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/internships — list lowongan aktif (publik)
router.get('/', async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const where = { status: 'ACTIVE', deletedAt: null };

    if (req.query.search) {
      where.OR = [
        { title: { contains: req.query.search, mode: 'insensitive' } },
        { commodity: { contains: req.query.search, mode: 'insensitive' } },
      ];
    }
    if (req.query.location) {
      where.location = { contains: req.query.location, mode: 'insensitive' };
    }
    if (req.query.commodity) {
      where.commodity = { contains: req.query.commodity, mode: 'insensitive' };
    }

    const [internships, total] = await Promise.all([
      prisma.internship.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, title: true, commodity: true, location: true,
          durationMonths: true, quota: true, acceptedCount: true,
          deadline: true, status: true, createdAt: true,
          user: { select: { id: true, fullName: true } },
        },
      }),
      prisma.internship.count({ where }),
    ]);

    return success(res, {
      data: internships.map((i) => ({ ...i, farmer: i.user, user: undefined })),
      meta: paginationMeta(total, page, limit),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/internships/:id — detail lowongan
router.get('/:id', async (req, res, next) => {
  try {
    const internship = await prisma.internship.findFirst({
      where: { id: req.params.id, deletedAt: null },
      include: {
        user: { select: { id: true, fullName: true } },
        curriculumWeeks: {
          orderBy: { weekNumber: 'asc' },
          include: { activities: true },
        },
      },
    });

    if (!internship) throw ApiError.notFound('Lowongan tidak ditemukan');

    const { user, curriculumWeeks, ...rest } = internship;
    return success(res, {
      data: {
        ...rest,
        farmer: user,
        curriculum: curriculumWeeks,
      },
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/internships/:id — edit lowongan
router.put('/:id', auth, authorize('FARMER'), validate(updateInternshipSchema), async (req, res, next) => {
  try {
    const internship = await prisma.internship.findFirst({
      where: { id: req.params.id, userId: req.user.id, deletedAt: null },
    });
    if (!internship) throw ApiError.notFound('Lowongan tidak ditemukan');
    if (!['DRAFT', 'ACTIVE'].includes(internship.status)) {
      throw ApiError.badRequest('Lowongan dengan status ini tidak bisa diedit');
    }

    const updateData = { ...req.body };
    if (req.body.durationMonths) {
      updateData.durationWeeks = req.body.durationMonths * WEEKS_PER_MONTH;
    }
    if (req.body.deadline) {
      updateData.deadline = new Date(req.body.deadline);
    }

    const updated = await prisma.internship.update({
      where: { id: req.params.id },
      data: updateData,
    });

    return success(res, { message: 'Lowongan berhasil diperbarui', data: updated });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/internships/:id/publish — publish draft
router.patch('/:id/publish', auth, authorize('FARMER'), async (req, res, next) => {
  try {
    const internship = await prisma.internship.findFirst({
      where: { id: req.params.id, userId: req.user.id, deletedAt: null },
      include: { _count: { select: { curriculumWeeks: true } } },
    });
    if (!internship) throw ApiError.notFound('Lowongan tidak ditemukan');
    if (internship.status !== 'DRAFT') throw ApiError.badRequest('Hanya lowongan draft yang bisa dipublikasikan');
    if (internship._count.curriculumWeeks === 0) throw ApiError.badRequest('Kurikulum belum dibuat');

    await prisma.internship.update({
      where: { id: req.params.id },
      data: { status: 'ACTIVE' },
    });

    return success(res, { message: 'Lowongan berhasil dipublikasikan' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/internships/:id — soft delete
router.delete('/:id', auth, authorize('FARMER'), async (req, res, next) => {
  try {
    const internship = await prisma.internship.findFirst({
      where: { id: req.params.id, userId: req.user.id, deletedAt: null },
      include: {
        applications: {
          where: { status: 'REVIEW' },
          include: { student: { select: { email: true, fullName: true } } },
        },
      },
    });
    if (!internship) throw ApiError.notFound('Lowongan tidak ditemukan');

    await prisma.internship.update({
      where: { id: req.params.id },
      data: { status: 'DELETED', deletedAt: new Date() },
    });

    // Notify applicants
    for (const app of internship.applications) {
      const emailData = internshipCancelledEmail(app.student.fullName, internship.title);
      sendEmail({ to: app.student.email, ...emailData });
    }

    return success(res, { message: 'Lowongan berhasil dihapus' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
