const cron = require('node-cron');
const prisma = require('../config/database');

/**
 * Scheduled Jobs — berjalan harian pukul 00:00 WIB (17:00 UTC)
 */

// 1. Tutup lowongan magang yang deadline-nya sudah lewat
cron.schedule('0 17 * * *', async () => {
  try {
    const result = await prisma.internship.updateMany({
      where: {
        status: 'ACTIVE',
        deadline: { lt: new Date() },
        deletedAt: null,
      },
      data: { status: 'CLOSED' },
    });
    if (result.count > 0) {
      console.log(`[CRON] Closed ${result.count} expired internships`);
    }
  } catch (error) {
    console.error('[CRON] Error closing expired internships:', error);
  }
});

// 2. Cleanup lowongan Job Connector yang belum dibayar > 24 jam
cron.schedule('0 17 * * *', async () => {
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const result = await prisma.job.updateMany({
      where: {
        status: { in: ['UNPAID', 'PENDING_PAYMENT'] },
        createdAt: { lt: cutoff },
      },
      data: { status: 'EXPIRED' },
    });
    if (result.count > 0) {
      console.log(`[CRON] Expired ${result.count} unpaid jobs`);
    }
  } catch (error) {
    console.error('[CRON] Error expiring unpaid jobs:', error);
  }
});

console.log('⏰ Scheduled tasks registered');
