const router = require('express').Router();
const auth = require('../../middlewares/auth');
const authorize = require('../../middlewares/authorize');
const { uploadDocumentation } = require('../../middlewares/upload');
const { success } = require('../../utils/apiResponse');
const prisma = require('../../config/database');
const ApiError = require('../../utils/apiError');
const { uploadToSupabase, deleteFromSupabase, getSignedUrl } = require('../../utils/fileUpload');

// GET /api/logbook/:entryId — Detail satu minggu
router.get('/:entryId', auth, async (req, res, next) => {
  try {
    const entry = await prisma.logbookEntry.findUnique({
      where: { id: req.params.entryId },
      include: {
        activities: true,
        documentations: true,
        application: {
          select: {
            id: true,
            studentId: true,
            internshipId: true,
            internship: { select: { id: true, title: true, userId: true } },
          },
        },
      },
    });
    if (!entry) throw ApiError.notFound('Logbook entry tidak ditemukan');

    // Auth check
    if (req.user.id !== entry.application.studentId && req.user.id !== entry.application.internship.userId) {
      throw ApiError.forbidden();
    }

    // Generate signed URLs for docs
    const docs = await Promise.all(
      entry.documentations.map(async (doc) => ({
        id: doc.id,
        url: doc.url || await getSignedUrl('logbook-docs', doc.filePath),
        createdAt: doc.createdAt,
      }))
    );

    return success(res, {
      data: {
        ...entry,
        applicationId: entry.applicationId || entry.application?.id,
        internshipId: entry.application?.internshipId || entry.application?.internship?.id,
        internshipTitle: entry.application?.internship?.title || '',
        documentations: docs,
        application: undefined,
      },
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/logbook/:entryId — Update progress
router.patch('/:entryId', auth, authorize('STUDENT'), async (req, res, next) => {
  try {
    const entry = await prisma.logbookEntry.findUnique({
      where: { id: req.params.entryId },
      include: { application: { select: { studentId: true } }, activities: true },
    });
    if (!entry) throw ApiError.notFound('Logbook entry tidak ditemukan');
    if (req.user.id !== entry.application.studentId) throw ApiError.forbidden();

    // Update activities completion
    if (req.body.activities) {
      for (const act of req.body.activities) {
        await prisma.logbookActivity.update({
          where: { id: act.id },
          data: { isCompleted: act.isCompleted },
        });
      }
    }

    // Update reflection
    if (req.body.reflection !== undefined) {
      await prisma.logbookEntry.update({
        where: { id: req.params.entryId },
        data: { reflection: req.body.reflection },
      });
    }

    // Recalculate completion percentage
    const activities = await prisma.logbookActivity.findMany({
      where: { logbookEntryId: req.params.entryId },
    });
    const totalWeight = activities.reduce((sum, a) => sum + a.weight, 0);
    const completedWeight = activities.filter((a) => a.isCompleted).reduce((sum, a) => sum + a.weight, 0);
    const percentage = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;

    let status = 'NOT_STARTED';
    if (percentage === 100) status = 'COMPLETED';
    else if (percentage > 0) status = 'IN_PROGRESS';

    await prisma.logbookEntry.update({
      where: { id: req.params.entryId },
      data: { completionPercentage: percentage, status },
    });

    return success(res, { message: 'Progress berhasil disimpan' });
  } catch (error) {
    next(error);
  }
});

// POST /api/logbook/:entryId/documentation — Upload bukti
router.post('/:entryId/documentation', auth, authorize('STUDENT'), uploadDocumentation, async (req, res, next) => {
  try {
    const entry = await prisma.logbookEntry.findUnique({
      where: { id: req.params.entryId },
      include: { application: { select: { id: true, studentId: true } } },
    });
    if (!entry) throw ApiError.notFound('Logbook entry tidak ditemukan');
    if (req.user.id !== entry.application.studentId) throw ApiError.forbidden();

    const rawFiles = req.files || (req.file ? [req.file] : []);
    if (rawFiles.length === 0) {
      throw ApiError.badRequest('Minimal upload 1 file foto dokumentasi');
    }

    const docs = [];
    for (const file of rawFiles) {
      const result = await uploadToSupabase(file.buffer, file.originalname, 'logbook-docs', req.params.entryId);
      const doc = await prisma.logbookDocumentation.create({
        data: {
          logbookEntryId: req.params.entryId,
          url: result.url,
          filePath: result.filePath,
        },
      });
      docs.push(doc);
    }

    // Update evaluation documentation count
    const totalDocs = await prisma.logbookDocumentation.count({
      where: { logbookEntryId: req.params.entryId },
    });
    await prisma.evaluation.updateMany({
      where: { applicationId: entry.application.id, weekNumber: entry.weekNumber },
      data: { documentationCount: totalDocs },
    });

    return success(res, { statusCode: 201, message: 'Dokumentasi berhasil diupload', data: docs });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/logbook/documentation/:docId — Hapus bukti
router.delete('/documentation/:docId', auth, authorize('STUDENT'), async (req, res, next) => {
  try {
    const doc = await prisma.logbookDocumentation.findUnique({
      where: { id: req.params.docId },
      include: { logbookEntry: { include: { application: { select: { studentId: true } } } } },
    });
    if (!doc) throw ApiError.notFound('Dokumentasi tidak ditemukan');
    if (req.user.id !== doc.logbookEntry.application.studentId) throw ApiError.forbidden();

    await deleteFromSupabase('logbook-docs', doc.filePath);
    await prisma.logbookDocumentation.delete({ where: { id: req.params.docId } });

    return success(res, { message: 'Dokumentasi berhasil dihapus' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
