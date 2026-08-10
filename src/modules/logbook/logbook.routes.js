const router = require('express').Router();
const auth = require('../../middlewares/auth');
const authorize = require('../../middlewares/authorize');
const { uploadDocumentation } = require('../../middlewares/upload');
const { success } = require('../../utils/apiResponse');
const prisma = require('../../config/database');
const ApiError = require('../../utils/apiError');
const { uploadToSupabase, deleteFromSupabase } = require('../../utils/fileUpload');

// GET /api/internships/:id/logbook — List semua minggu logbook
router.get('/:id/logbook', auth, async (req, res, next) => {
  try {
    const applicationId = req.query.applicationId;
    if (!applicationId) throw ApiError.badRequest('applicationId wajib diisi');

    const application = await prisma.application.findFirst({
      where: {
        id: applicationId,
        internshipId: req.params.id,
        status: { in: ['ACCEPTED', 'GRADUATED'] },
      },
      include: {
        internship: { select: { id: true, title: true, userId: true } },
      },
    });
    if (!application) throw ApiError.notFound('Data magang tidak ditemukan');

    // Authorization: only the student or the farmer can view
    if (req.user.id !== application.studentId && req.user.id !== application.internship.userId) {
      throw ApiError.forbidden('Anda tidak memiliki akses');
    }

    const entries = await prisma.logbookEntry.findMany({
      where: { applicationId },
      orderBy: { weekNumber: 'asc' },
      select: {
        id: true, weekNumber: true, title: true, status: true,
        completionPercentage: true, reflection: true,
        _count: { select: { documentations: true } },
      },
    });

    const totalWeeks = entries.length;
    const completedWeeks = entries.filter((e) => e.status === 'COMPLETED').length;
    const overallProgress = totalWeeks > 0 ? Math.round((completedWeeks / totalWeeks) * 100) : 0;

    return success(res, {
      data: {
        internship: application.internship,
        overallProgress,
        weeks: entries.map((e) => ({
          ...e,
          documentationCount: e._count.documentations,
          hasReflection: !!e.reflection,
          _count: undefined,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
