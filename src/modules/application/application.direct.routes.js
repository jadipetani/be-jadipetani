const router = require('express').Router();
const auth = require('../../middlewares/auth');
const authorize = require('../../middlewares/authorize');
const { success } = require('../../utils/apiResponse');
const prisma = require('../../config/database');
const ApiError = require('../../utils/apiError');
const { getSignedUrl } = require('../../utils/fileUpload');
const { sendEmail, applicationAcceptedEmail, applicationRejectedEmail } = require('../../utils/emailService');

// GET /api/applications/my — List lamaran milik pelajar login (MUST BE BEFORE /:id)
router.get('/my', auth, authorize('STUDENT'), async (req, res, next) => {
  try {
    const { paginate, paginationMeta } = require('../../utils/pagination');
    const { page, limit, skip } = paginate(req.query);
    const where = { studentId: req.user.id };

    if (req.query.status) where.status = req.query.status;

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          internship: {
            select: { id: true, title: true, commodity: true, location: true, user: { select: { fullName: true } } },
          },
          job: {
            select: { id: true, title: true, location: true, offeredSalary: true, user: { select: { fullName: true } } },
          },
        },
      }),
      prisma.application.count({ where }),
    ]);

    return success(res, {
      data: applications,
      meta: paginationMeta(total, page, limit),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/applications/:id — Detail lamaran
router.get('/:id', auth, async (req, res, next) => {
  try {
    const application = await prisma.application.findUnique({
      where: { id: req.params.id },
      include: {
        student: { select: { id: true, fullName: true, email: true, phone: true, institution: true, bio: true } },
        internship: {
          select: { id: true, title: true, commodity: true, location: true, userId: true, user: { select: { fullName: true } } },
        },
      },
    });

    if (!application) throw ApiError.notFound('Lamaran tidak ditemukan');

    // Access check: only applicant or internship owner
    if (req.user.id !== application.studentId && req.user.id !== application.internship?.userId) {
      throw ApiError.forbidden();
    }

    // Generate signed URLs for CV & portfolio
    const cvUrl = await getSignedUrl('cv', application.cvPath);
    let portfolioUrl = null;
    if (application.portfolioPath) {
      portfolioUrl = await getSignedUrl('portfolios', application.portfolioPath);
    }

    return success(res, {
      data: {
        ...application,
        cvUrl,
        portfolioUrl,
      },
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/applications/:id/accept — Terima pendaftar
router.patch('/:id/accept', auth, authorize('FARMER'), async (req, res, next) => {
  try {
    const application = await prisma.application.findUnique({
      where: { id: req.params.id },
      include: {
        student: { select: { id: true, fullName: true, email: true } },
        internship: {
          include: {
            curriculumWeeks: { include: { activities: true } },
            user: { select: { fullName: true } },
          },
        },
      },
    });

    if (!application) throw ApiError.notFound('Lamaran tidak ditemukan');
    if (application.internship.userId !== req.user.id) throw ApiError.forbidden();

    // Idempotent check: If already ACCEPTED, return success directly
    if (application.status === 'ACCEPTED') {
      return success(res, { message: 'Lamaran ini sudah diterima sebelumnya. Logbook peserta telah aktif.' });
    }

    if (application.status !== 'REVIEW') {
      throw ApiError.badRequest(`Lamaran tidak dapat diterima karena status saat ini: ${application.status}`);
    }

    // Quota check
    if (application.internship.acceptedCount >= application.internship.quota) {
      throw ApiError.badRequest('Kuota magang sudah penuh');
    }

    // Execute in transaction
    await prisma.$transaction(async (tx) => {
      // 1. Update application status
      await tx.application.update({
        where: { id: application.id },
        data: { status: 'ACCEPTED' },
      });

      // 2. Increment acceptedCount
      await tx.internship.update({
        where: { id: application.internshipId },
        data: { acceptedCount: { increment: 1 } },
      });

      // 3. Auto-generate logbook entries & activities from curriculum if not exist
      for (const week of application.internship.curriculumWeeks) {
        const existingEntry = await tx.logbookEntry.findUnique({
          where: { applicationId_weekNumber: { applicationId: application.id, weekNumber: week.weekNumber } },
        });

        if (!existingEntry) {
          await tx.logbookEntry.create({
            data: {
              applicationId: application.id,
              weekNumber: week.weekNumber,
              title: week.title,
              description: week.description,
              status: 'NOT_STARTED',
              completionPercentage: 0,
              activities: {
                create: week.activities.map((act) => ({
                  name: act.name,
                  description: act.description,
                  weight: act.weight,
                  isCompleted: false,
                  curriculumActivityId: act.id,
                })),
              },
            },
          });
        }

        const existingEval = await tx.evaluation.findUnique({
          where: { applicationId_weekNumber: { applicationId: application.id, weekNumber: week.weekNumber } },
        });

        if (!existingEval) {
          await tx.evaluation.create({
            data: {
              applicationId: application.id,
              weekNumber: week.weekNumber,
              checklistCompleted: 0,
              checklistTotal: week.activities.length,
              documentationCount: 0,
              status: 'PENDING',
            },
          });
        }
      }
    });

    // Send acceptance email safely
    try {
      const farmerName = application.internship?.user?.fullName || 'Petani';
      const emailData = applicationAcceptedEmail(
        application.student.fullName,
        application.internship.title,
        farmerName
      );
      sendEmail({ to: application.student.email, ...emailData }).catch((e) =>
        console.error('[Email Error] Accept notification failed:', e.message)
      );
    } catch (emailErr) {
      console.warn('[Email Warning] Error crafting accept email:', emailErr.message);
    }

    return success(res, { message: 'Lamaran berhasil diterima. Logbook peserta telah dibuat.' });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/applications/:id/reject — Tolak pendaftar
router.patch('/:id/reject', auth, authorize('FARMER'), async (req, res, next) => {
  try {
    const application = await prisma.application.findUnique({
      where: { id: req.params.id },
      include: {
        student: { select: { fullName: true, email: true } },
        internship: { select: { title: true, userId: true } },
      },
    });

    if (!application) throw ApiError.notFound('Lamaran tidak ditemukan');
    if (application.internship.userId !== req.user.id) throw ApiError.forbidden();
    if (application.status !== 'REVIEW') throw ApiError.badRequest('Lamaran sudah diproses sebelumnya');

    await prisma.application.update({
      where: { id: application.id },
      data: { status: 'REJECTED' },
    });

    // Send rejection email
    const emailData = applicationRejectedEmail(application.student.fullName, application.internship.title);
    sendEmail({ to: application.student.email, ...emailData });

    return success(res, { message: 'Lamaran ditolak' });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/applications/:id/cancel — Batal lamaran oleh pelajar
router.patch('/:id/cancel', auth, authorize('STUDENT'), async (req, res, next) => {
  try {
    const application = await prisma.application.findUnique({
      where: { id: req.params.id },
    });

    if (!application) throw ApiError.notFound('Lamaran tidak ditemukan');
    if (application.studentId !== req.user.id) throw ApiError.forbidden();
    if (application.status !== 'REVIEW') throw ApiError.badRequest('Hanya lamaran yang dalam status REVIEW yang bisa dibatalkan');

    await prisma.application.update({
      where: { id: application.id },
      data: { status: 'CANCELLED' },
    });

    return success(res, { message: 'Lamaran berhasil dibatalkan' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/applications/:id — Hapus lamaran (hanya status REVIEW)
router.delete('/:id', auth, authorize('STUDENT'), async (req, res, next) => {
  try {
    const application = await prisma.application.findUnique({
      where: { id: req.params.id },
    });

    if (!application) throw ApiError.notFound('Lamaran tidak ditemukan');
    if (application.studentId !== req.user.id) throw ApiError.forbidden();
    if (application.status !== 'REVIEW' && application.status !== 'CANCELLED') {
      throw ApiError.badRequest('Hanya lamaran REVIEW atau CANCELLED yang bisa dihapus');
    }

    await prisma.application.delete({ where: { id: application.id } });
    return success(res, { message: 'Lamaran berhasil dihapus' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
