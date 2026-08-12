const router = require('express').Router();
const auth = require('../../middlewares/auth');
const authorize = require('../../middlewares/authorize');
const { success } = require('../../utils/apiResponse');
const prisma = require('../../config/database');
const ApiError = require('../../utils/apiError');

// GET /api/certificates/my — List sertifikat milik pelajar / yang diterbitkan petani
router.get('/my', auth, async (req, res, next) => {
  try {
    const where = req.user.role === 'FARMER'
      ? { application: { internship: { userId: req.user.id } } }
      : { studentId: req.user.id };

    const certificates = await prisma.certificate.findMany({
      where,
      orderBy: { issuedAt: 'desc' },
      include: {
        student: { select: { id: true, fullName: true } },
        application: {
          include: { internship: { select: { id: true, title: true } } },
        },
      },
    });

    return success(res, {
      data: certificates.map((c) => ({
        id: c.id,
        certificateNumber: c.certificateNumber,
        studentName: c.student?.fullName || '',
        internship: c.application?.internship || null,
        internshipTitle: c.application?.internship?.title || '',
        issuedAt: c.issuedAt,
        pdfUrl: c.pdfUrl,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/certificates/:id — Detail sertifikat & transkrip
router.get('/:id', auth, async (req, res, next) => {
  try {
    const cert = await prisma.certificate.findFirst({
      where: {
        OR: [
          { id: req.params.id },
          { applicationId: req.params.id },
        ],
      },
      include: {
        student: { select: { id: true, fullName: true, institution: true } },
        application: {
          include: {
            internship: {
              select: {
                id: true,
                title: true,
                commodity: true,
                location: true,
                durationMonths: true,
                durationWeeks: true,
                user: { select: { fullName: true } },
                curriculumWeeks: { orderBy: { weekNumber: 'asc' } },
              },
            },
            evaluations: {
              orderBy: { weekNumber: 'asc' },
            },
          },
        },
      },
    });
    if (!cert) throw ApiError.notFound('Sertifikat tidak ditemukan');

    const curriculumMap = {};
    (cert.application?.internship?.curriculumWeeks || []).forEach((w) => {
      curriculumMap[w.weekNumber] = w.title;
    });

    const evaluationsWithTitles = (cert.application?.evaluations || []).map((ev) => ({
      ...ev,
      title: curriculumMap[ev.weekNumber] || `Evaluasi Mingguan ke-${ev.weekNumber}`,
    }));

    return success(res, {
      data: {
        ...cert,
        studentName: cert.student?.fullName || '',
        studentInstitution: cert.student?.institution || '',
        internshipTitle: cert.application?.internship?.title || '',
        farmerName: cert.application?.internship?.user?.fullName || '',
        evaluations: evaluationsWithTitles,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/certificates/:id/download — Download PDF (Public download link)
router.get('/:id/download', async (req, res, next) => {
  try {
    const cert = await prisma.certificate.findFirst({
      where: {
        OR: [
          { id: req.params.id },
          { applicationId: req.params.id },
        ],
      },
      include: {
        student: { select: { id: true, fullName: true } },
        application: {
          include: {
            internship: {
              select: {
                title: true,
                commodity: true,
                location: true,
                durationMonths: true,
                user: { select: { fullName: true } },
                curriculumWeeks: { select: { title: true } },
              },
            },
          },
        },
      },
    });

    if (!cert) throw ApiError.notFound('Sertifikat tidak ditemukan');

    // Always generate/sync fresh PDF matching live student & internship details
    try {
      const { generateAndUploadCertificate } = require('../../utils/pdfGenerator');
      const skills = cert.application?.internship?.curriculumWeeks?.map((w) => w.title) || [];
      const pdfResult = await generateAndUploadCertificate({
        certificateNumber: cert.certificateNumber,
        studentName: cert.student?.fullName || 'Peserta Magang',
        internshipTitle: cert.application?.internship?.title || 'Program Magang Pertanian',
        commodity: cert.application?.internship?.commodity || 'Agribisnis',
        location: cert.application?.internship?.location || 'Indonesia',
        durationMonths: cert.application?.internship?.durationMonths || 1,
        skills,
        farmerName: cert.application?.internship?.user?.fullName || 'Petani Pembimbing',
        issuedDate: cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('id-ID'),
      });

      if (pdfResult.pdfUrl && pdfResult.pdfUrl !== cert.pdfUrl) {
        await prisma.certificate.update({
          where: { id: cert.id },
          data: { pdfUrl: pdfResult.pdfUrl, pdfPath: pdfResult.pdfPath },
        });
        cert.pdfUrl = pdfResult.pdfUrl;
      }
    } catch (pdfErr) {
      console.warn('[PDF Sync Warning] Regeneration fallback:', pdfErr.message);
    }

    if (!cert.pdfUrl) throw ApiError.badRequest('Sertifikat PDF belum tersedia');
    return res.redirect(cert.pdfUrl);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/certificates/:id — Hapus/cabut sertifikat
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const cert = await prisma.certificate.findUnique({
      where: { id: req.params.id },
      include: { application: { include: { internship: { select: { userId: true } } } } },
    });

    if (!cert) throw ApiError.notFound('Sertifikat tidak ditemukan');
    // Auth check: only farmer owner or student owner
    if (req.user.id !== cert.studentId && req.user.id !== cert.application.internship.userId) {
      throw ApiError.forbidden();
    }

    await prisma.certificate.delete({ where: { id: cert.id } });
    return success(res, { message: 'Sertifikat berhasil dihapus' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
