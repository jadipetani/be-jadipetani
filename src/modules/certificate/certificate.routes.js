const router = require('express').Router();
const auth = require('../../middlewares/auth');
const authorize = require('../../middlewares/authorize');
const { success } = require('../../utils/apiResponse');
const prisma = require('../../config/database');
const ApiError = require('../../utils/apiError');

// GET /api/certificates/my — List sertifikat milik pelajar
router.get('/my', auth, authorize('STUDENT'), async (req, res, next) => {
  try {
    const certificates = await prisma.certificate.findMany({
      where: { studentId: req.user.id },
      orderBy: { issuedAt: 'desc' },
      include: {
        application: {
          include: { internship: { select: { id: true, title: true } } },
        },
      },
    });

    return success(res, {
      data: certificates.map((c) => ({
        id: c.id,
        certificateNumber: c.certificateNumber,
        internship: c.application?.internship || null,
        issuedAt: c.issuedAt,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/certificates/:id — Detail sertifikat
router.get('/:id', auth, async (req, res, next) => {
  try {
    const cert = await prisma.certificate.findUnique({
      where: { id: req.params.id },
      include: {
        student: { select: { id: true, fullName: true } },
        application: {
          include: { internship: { select: { id: true, title: true, commodity: true, location: true, durationMonths: true } } },
        },
      },
    });
    if (!cert) throw ApiError.notFound('Sertifikat tidak ditemukan');

    return success(res, { data: cert });
  } catch (error) {
    next(error);
  }
});

// GET /api/certificates/:id/download — Download PDF
router.get('/:id/download', auth, async (req, res, next) => {
  try {
    const cert = await prisma.certificate.findUnique({ where: { id: req.params.id } });
    if (!cert) throw ApiError.notFound('Sertifikat tidak ditemukan');
    if (!cert.pdfUrl) throw ApiError.badRequest('Sertifikat PDF belum tersedia');

    return res.redirect(cert.pdfUrl);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
