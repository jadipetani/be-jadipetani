const router = require('express').Router();
const auth = require('../../middlewares/auth');
const authorize = require('../../middlewares/authorize');
const { success } = require('../../utils/apiResponse');
const prisma = require('../../config/database');

// GET /api/dashboard/farmer
router.get('/farmer', auth, authorize('FARMER'), async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [activeListings, newApplicants, activeInternships, certificatesIssued] = await Promise.all([
      prisma.internship.count({ where: { userId, status: 'ACTIVE', deletedAt: null } }),
      prisma.application.count({
        where: { internship: { userId }, status: 'REVIEW', type: 'INTERNSHIP' },
      }),
      prisma.application.count({
        where: { internship: { userId }, status: 'ACCEPTED', type: 'INTERNSHIP' },
      }),
      prisma.certificate.count({
        where: { application: { internship: { userId } } },
      }),
    ]);

    return success(res, {
      data: { activeListings, newApplicants, activeInternships, certificatesIssued },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/student
router.get('/student', auth, authorize('STUDENT'), async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [activeApplications, activeInternships, certificatesEarned] = await Promise.all([
      prisma.application.count({ where: { studentId: userId, status: 'REVIEW' } }),
      prisma.application.count({ where: { studentId: userId, status: 'ACCEPTED' } }),
      prisma.certificate.count({ where: { studentId: userId } }),
    ]);

    return success(res, {
      data: { activeApplications, activeInternships, certificatesEarned },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
