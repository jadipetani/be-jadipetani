const router = require('express').Router();
const { success } = require('../../utils/apiResponse');
const prisma = require('../../config/database');

// GET /api/landing/stats — Platform statistics (publik)
router.get('/stats', async (_req, res, next) => {
  try {
    const [registeredFarmers, activeStudents, internshipPrograms, connectedLands] = await Promise.all([
      prisma.user.count({ where: { role: 'FARMER' } }),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.internship.count({ where: { deletedAt: null } }),
      prisma.internship.count({ where: { status: 'ACTIVE', deletedAt: null } }),
    ]);

    return success(res, {
      data: { registeredFarmers, activeStudents, internshipPrograms, connectedLands },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
