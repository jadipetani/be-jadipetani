const router = require('express').Router();
const auth = require('../../middlewares/auth');
const authorize = require('../../middlewares/authorize');
const validate = require('../../middlewares/validate');
const { success } = require('../../utils/apiResponse');
const { paginate, paginationMeta } = require('../../utils/pagination');
const prisma = require('../../config/database');
const ApiError = require('../../utils/apiError');
const { snap } = require('../../config/midtrans');
const { PLACEMENT_FEE_RATE, MIN_OFFERED_SALARY } = require('../../utils/constants');
const { z } = require('zod');

// === Zod Schemas ===
const createJobSchema = z.object({
  title: z.string().trim().min(5, 'Judul minimal 5 karakter').max(200),
  location: z.string().trim().min(5).max(300),
  description: z.string().trim().min(10).max(5000),
  qualifications: z.string().trim().min(10).max(3000),
  offeredSalary: z.coerce.number().int().min(MIN_OFFERED_SALARY, `Gaji minimum Rp ${MIN_OFFERED_SALARY.toLocaleString('id-ID')}`),
});

// POST /api/jobs — Buat lowongan + initiate payment
router.post('/', auth, authorize('FARMER'), validate(createJobSchema), async (req, res, next) => {
  try {
    const { offeredSalary } = req.body;
    // Placement fee calculated in BACKEND
    const placementFee = Math.round(offeredSalary * PLACEMENT_FEE_RATE);

    const farmer = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { fullName: true, email: true },
    });

    // 1. Create Job record in UNPAID status
    const job = await prisma.job.create({
      data: {
        ...req.body,
        placementFee,
        status: 'UNPAID',
        userId: req.user.id,
      },
    });

    // 2. Create Midtrans transaction
    const orderId = `JP-JOB-${job.id.slice(0, 8)}-${Date.now()}`;
    let snapToken = null;

    try {
      const parameter = {
        transaction_details: {
          order_id: orderId,
          gross_amount: placementFee,
        },
        item_details: [
          {
            id: `placement-fee-${job.id.slice(0, 8)}`,
            price: placementFee,
            quantity: 1,
            name: `Placement Fee: ${job.title}`.substring(0, 50),
          },
        ],
        customer_details: {
          first_name: farmer.fullName,
          email: farmer.email,
        },
      };

      const transaction = await snap.createTransaction(parameter);
      snapToken = transaction.token;

      // Update job with orderId, snapToken & status PENDING_PAYMENT
      await prisma.job.update({
        where: { id: job.id },
        data: {
          snapToken,
          orderId,
          status: 'PENDING_PAYMENT',
        },
      });

      // Log payment
      await prisma.paymentLog.create({
        data: {
          jobId: job.id,
          orderId,
          amount: placementFee,
          status: 'PENDING',
        },
      });
    } catch (midtransErr) {
      console.error('Midtrans Snap error:', midtransErr);
      // Job remains in UNPAID status, can retry later
    }

    return success(res, {
      statusCode: 201,
      message: 'Lowongan kerja berhasil dibuat. Silakan selesaikan pembayaran.',
      data: { job, snapToken, orderId },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/jobs — List published jobs (Publik)
router.get('/', async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const where = { status: 'PUBLISHED' };

    if (req.query.search) {
      where.OR = [
        { title: { contains: req.query.search, mode: 'insensitive' } },
        { description: { contains: req.query.search, mode: 'insensitive' } },
      ];
    }
    if (req.query.location) {
      where.location = { contains: req.query.location, mode: 'insensitive' };
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, title: true, location: true, offeredSalary: true,
          status: true, createdAt: true,
          user: { select: { id: true, fullName: true } },
        },
      }),
      prisma.job.count({ where }),
    ]);

    return success(res, {
      data: jobs.map((j) => ({ ...j, farmer: j.user, user: undefined })),
      meta: paginationMeta(total, page, limit),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/jobs/my — List lowongan milik petani (semua status)
router.get('/my', auth, authorize('FARMER'), async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const where = { userId: req.user.id };
    if (req.query.status) where.status = req.query.status;

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { applications: true } } },
      }),
      prisma.job.count({ where }),
    ]);

    return success(res, {
      data: jobs,
      meta: paginationMeta(total, page, limit),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/jobs/:id — Detail lowongan
router.get('/:id', async (req, res, next) => {
  try {
    const job = await prisma.job.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, fullName: true, institution: true } },
      },
    });

    if (!job) throw ApiError.notFound('Lowongan kerja tidak ditemukan');

    // Only PUBLISHED jobs are public, unless requested by owner
    if (job.status !== 'PUBLISHED') {
      // If user is authenticated as farmer owner, allow view
      const authHeader = req.headers.authorization;
      if (!authHeader) throw ApiError.notFound('Lowongan kerja tidak ditemukan');
    }

    const { user, ...rest } = job;
    return success(res, {
      data: { ...rest, farmer: user },
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/jobs/:id/close — Tutup lowongan manual
router.patch('/:id/close', auth, authorize('FARMER'), async (req, res, next) => {
  try {
    const job = await prisma.job.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!job) throw ApiError.notFound('Lowongan tidak ditemukan');
    if (job.status !== 'PUBLISHED') {
      throw ApiError.badRequest('Hanya lowongan berstatus PUBLISHED yang bisa ditutup');
    }

    await prisma.job.update({
      where: { id: job.id },
      data: { status: 'CLOSED' },
    });

    return success(res, { message: 'Lowongan kerja berhasil ditutup' });
  } catch (error) {
    next(error);
  }
});

// POST /api/jobs/:id/retry-payment — Retry payment untuk status PAYMENT_FAILED / EXPIRED / UNPAID
router.post('/:id/retry-payment', auth, authorize('FARMER'), async (req, res, next) => {
  try {
    const job = await prisma.job.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: { user: { select: { fullName: true, email: true } } },
    });

    if (!job) throw ApiError.notFound('Lowongan tidak ditemukan');
    if (!['UNPAID', 'PAYMENT_FAILED', 'EXPIRED'].includes(job.status)) {
      throw ApiError.badRequest('Lowongan ini tidak memerlukan pembayaran ulang');
    }

    const orderId = `JP-JOB-${job.id.slice(0, 8)}-${Date.now()}`;
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: job.placementFee,
      },
      item_details: [
        {
          id: `placement-fee-${job.id.slice(0, 8)}`,
          price: job.placementFee,
          quantity: 1,
          name: `Placement Fee: ${job.title}`.substring(0, 50),
        },
      ],
      customer_details: {
        first_name: job.user.fullName,
        email: job.user.email,
      },
    };

    const transaction = await snap.createTransaction(parameter);

    await prisma.job.update({
      where: { id: job.id },
      data: {
        snapToken: transaction.token,
        orderId,
        status: 'PENDING_PAYMENT',
      },
    });

    await prisma.paymentLog.create({
      data: {
        jobId: job.id,
        orderId,
        amount: job.placementFee,
        status: 'PENDING',
      },
    });

    return success(res, {
      message: 'Token pembayaran baru berhasil dibuat',
      data: { snapToken: transaction.token, orderId },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
