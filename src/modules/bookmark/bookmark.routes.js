const router = require('express').Router();
const auth = require('../../middlewares/auth');
const authorize = require('../../middlewares/authorize');
const { success } = require('../../utils/apiResponse');
const { paginate, paginationMeta } = require('../../utils/pagination');
const prisma = require('../../config/database');
const ApiError = require('../../utils/apiError');

// POST /api/bookmarks — Simpan / bookmark lowongan (Pelajar)
router.post('/', auth, authorize('STUDENT'), async (req, res, next) => {
  try {
    const { internshipId, jobId } = req.body;
    if (!internshipId && !jobId) {
      throw ApiError.badRequest('internshipId atau jobId wajib diisi');
    }

    const studentId = req.user.id;

    // Check duplicate
    const existing = await prisma.bookmark.findFirst({
      where: {
        studentId,
        ...(internshipId ? { internshipId } : { jobId }),
      },
    });
    if (existing) throw ApiError.badRequest('Lowongan ini sudah ada di daftar bookmark Anda');

    const bookmark = await prisma.bookmark.create({
      data: {
        studentId,
        internshipId: internshipId || null,
        jobId: jobId || null,
      },
    });

    return success(res, { statusCode: 201, message: 'Lowongan berhasil di-bookmark', data: bookmark });
  } catch (error) {
    next(error);
  }
});

// GET /api/bookmarks/my — List seluruh bookmark milik pelajar login
router.get('/my', auth, authorize('STUDENT'), async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const where = { studentId: req.user.id };

    const [bookmarks, total] = await Promise.all([
      prisma.bookmark.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          internship: {
            select: { id: true, title: true, commodity: true, location: true, durationMonths: true, user: { select: { fullName: true } } },
          },
          job: {
            select: { id: true, title: true, location: true, offeredSalary: true, user: { select: { fullName: true } } },
          },
        },
      }),
      prisma.bookmark.count({ where }),
    ]);

    return success(res, {
      data: bookmarks,
      meta: paginationMeta(total, page, limit),
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/bookmarks/:id — Hapus bookmark
router.delete('/:id', auth, authorize('STUDENT'), async (req, res, next) => {
  try {
    const bookmark = await prisma.bookmark.findUnique({
      where: { id: req.params.id },
    });
    if (!bookmark) throw ApiError.notFound('Bookmark tidak ditemukan');
    if (bookmark.studentId !== req.user.id) throw ApiError.forbidden();

    await prisma.bookmark.delete({ where: { id: bookmark.id } });
    return success(res, { message: 'Bookmark berhasil dihapus' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
