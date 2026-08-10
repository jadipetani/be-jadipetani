const router = require('express').Router();
const auth = require('../../middlewares/auth');
const authorize = require('../../middlewares/authorize');
const { success } = require('../../utils/apiResponse');
const prisma = require('../../config/database');
const ApiError = require('../../utils/apiError');

// PATCH /api/evaluations/:id/grade — Simpan penilaian satu minggu
router.patch('/:id/grade', auth, authorize('FARMER'), async (req, res, next) => {
  try {
    const { score, notes } = req.body;
    if (score === undefined || score < 1 || score > 100) {
      throw ApiError.badRequest('Skor harus antara 1-100');
    }

    const evaluation = await prisma.evaluation.findUnique({
      where: { id: req.params.id },
      include: { application: { include: { internship: { select: { userId: true } } } } },
    });
    if (!evaluation) throw ApiError.notFound('Evaluasi tidak ditemukan');
    if (evaluation.application.internship.userId !== req.user.id) throw ApiError.forbidden();

    const updated = await prisma.evaluation.update({
      where: { id: req.params.id },
      data: { score, notes: notes || null, status: 'GRADED' },
    });

    return success(res, { message: 'Penilaian berhasil disimpan', data: updated });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
