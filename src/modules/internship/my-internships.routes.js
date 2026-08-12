const router = require('express').Router();
const auth = require('../../middlewares/auth');
const authorize = require('../../middlewares/authorize');
const { uploadDocumentation } = require('../../middlewares/upload');
const { success } = require('../../utils/apiResponse');
const { paginate, paginationMeta } = require('../../utils/pagination');
const prisma = require('../../config/database');
const ApiError = require('../../utils/apiError');
const { uploadToSupabase } = require('../../utils/fileUpload');

// GET /api/my-internships — List program magang yang diikuti oleh pelajar
router.get('/', auth, authorize('STUDENT'), async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const where = {
      studentId: req.user.id,
      type: 'INTERNSHIP',
      status: { in: ['ACCEPTED', 'GRADUATED'] },
    };

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          internship: {
            select: { id: true, title: true, commodity: true, location: true, durationMonths: true, user: { select: { fullName: true } } },
          },
          logbookEntries: {
            select: { completionPercentage: true },
          },
        },
      }),
      prisma.application.count({ where }),
    ]);

    return success(res, {
      data: applications.map((app) => {
        const entries = app.logbookEntries || [];
        const overallProgress = entries.length > 0
          ? Math.round(entries.reduce((sum, e) => sum + (e.completionPercentage || 0), 0) / entries.length)
          : 0;

        return {
          applicationId: app.id,
          status: app.status,
          appliedAt: app.createdAt,
          overallProgress,
          internship: app.internship,
        };
      }),
      meta: paginationMeta(total, page, limit),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/my-internships/:id/logbook — Data logbook magang milik peserta
router.get('/:id/logbook', auth, authorize('STUDENT'), async (req, res, next) => {
  try {
    const application = await prisma.application.findFirst({
      where: {
        id: req.params.id,
        studentId: req.user.id,
        status: { in: ['ACCEPTED', 'GRADUATED'] },
      },
      include: {
        internship: { select: { id: true, title: true, commodity: true } },
        logbookEntries: {
          orderBy: { weekNumber: 'asc' },
          include: { activities: true, documentations: true },
        },
      },
    });

    if (!application) throw ApiError.notFound('Data magang tidak ditemukan');

    const entries = application.logbookEntries || [];
    const overallProgress = entries.length > 0
      ? Math.round(entries.reduce((sum, e) => sum + (e.completionPercentage || 0), 0) / entries.length)
      : 0;

    return success(res, {
      data: {
        internship: application.internship,
        overallProgress,
        weeks: application.logbookEntries,
      },
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/my-internships/:id/logbook/week/:weekNumber — Update checklist & refleksi per minggu
router.put('/:id/logbook/week/:weekNumber', auth, authorize('STUDENT'), async (req, res, next) => {
  try {
    const weekNum = parseInt(req.params.weekNumber, 10);
    const entry = await prisma.logbookEntry.findFirst({
      where: {
        applicationId: req.params.id,
        weekNumber: weekNum,
        application: { studentId: req.user.id },
      },
      include: { activities: true },
    });

    if (!entry) throw ApiError.notFound('Logbook minggu tersebut tidak ditemukan');

    if (req.body.activities) {
      for (const act of req.body.activities) {
        await prisma.logbookActivity.update({
          where: { id: act.id },
          data: { isCompleted: act.isCompleted },
        });
      }
    }

    if (req.body.reflection !== undefined) {
      await prisma.logbookEntry.update({
        where: { id: entry.id },
        data: { reflection: req.body.reflection },
      });
    }

    const activities = await prisma.logbookActivity.findMany({
      where: { logbookEntryId: entry.id },
    });
    const totalWeight = activities.reduce((sum, a) => sum + a.weight, 0);
    const completedWeight = activities.filter((a) => a.isCompleted).reduce((sum, a) => sum + a.weight, 0);
    const percentage = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;

    let status = 'NOT_STARTED';
    if (percentage === 100) status = 'COMPLETED';
    else if (percentage > 0) status = 'IN_PROGRESS';

    const updatedEntry = await prisma.logbookEntry.update({
      where: { id: entry.id },
      data: { completionPercentage: percentage, status },
      include: { activities: true },
    });

    return success(res, { message: 'Progress minggu ini berhasil diperbarui', data: updatedEntry });
  } catch (error) {
    next(error);
  }
});

// POST /api/my-internships/:id/logbook/week/:weekNumber/evidence — Upload bukti foto kegiatan
router.post('/:id/logbook/week/:weekNumber/evidence', auth, authorize('STUDENT'), uploadDocumentation, async (req, res, next) => {
  try {
    const weekNum = parseInt(req.params.weekNumber, 10);
    const entry = await prisma.logbookEntry.findFirst({
      where: {
        applicationId: req.params.id,
        weekNumber: weekNum,
        application: { studentId: req.user.id },
      },
    });

    if (!entry) throw ApiError.notFound('Logbook minggu tersebut tidak ditemukan');
    if (!req.files || req.files.length === 0) throw ApiError.badRequest('Minimal upload 1 file foto');

    const docs = [];
    for (const file of req.files) {
      const result = await uploadToSupabase(file.buffer, file.originalname, 'logbook-docs', entry.id);
      const doc = await prisma.logbookDocumentation.create({
        data: {
          logbookEntryId: entry.id,
          url: result.url,
          filePath: result.filePath,
        },
      });
      docs.push(doc);
    }

    return success(res, { statusCode: 201, message: 'Bukti kegiatan berhasil diupload', data: docs });
  } catch (error) {
    next(error);
  }
});

// POST /api/my-internships/:id/finish — Pelajar mengajukan penyelesaian magang (Selesai Magang)
router.post('/:id/finish', auth, authorize('STUDENT'), async (req, res, next) => {
  try {
    const application = await prisma.application.findFirst({
      where: {
        id: req.params.id,
        studentId: req.user.id,
        status: 'ACCEPTED',
      },
    });

    if (!application) throw ApiError.notFound('Program magang aktif tidak ditemukan atau sudah diselesaikan');

    return success(res, {
      message: 'Pengajuan penyelesaian magang berhasil dikirim. Menunggu konfirmasi kelulusan & penerbitan sertifikat dari Petani Pembimbing.',
      data: { applicationId: application.id, status: 'PENDING_GRADUATION' },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
