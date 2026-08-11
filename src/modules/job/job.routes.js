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
    let finalJob = job;

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
      finalJob = await prisma.job.update({
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
      console.error('Midtrans Snap error:', midtransErr.message);
      // Save orderId even if snap fails so retry-payment & payment-status can reference it
      finalJob = await prisma.job.update({
        where: { id: job.id },
        data: { orderId },
      });
    }

    return success(res, {
      statusCode: 201,
      message: 'Lowongan kerja berhasil dibuat. Silakan selesaikan pembayaran.',
      data: { job: finalJob, snapToken, orderId },
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
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const jwt = require('jsonwebtoken');
          const { env } = require('../../config/env');
          const token = authHeader.split(' ')[1];
          const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
          if (decoded.userId !== job.userId) {
            throw ApiError.notFound('Lowongan kerja tidak ditemukan');
          }
        } catch (e) {
          throw ApiError.notFound('Lowongan kerja tidak ditemukan');
        }
      } else {
        throw ApiError.notFound('Lowongan kerja tidak ditemukan');
      }
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

// POST /api/jobs/:id/retry-payment — Retry payment untuk status PENDING_PAYMENT / PAYMENT_FAILED / EXPIRED / UNPAID
router.post('/:id/retry-payment', auth, authorize('FARMER'), async (req, res, next) => {
  try {
    const job = await prisma.job.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: { user: { select: { fullName: true, email: true } } },
    });

    if (!job) throw ApiError.notFound('Lowongan tidak ditemukan');
    if (job.status === 'PUBLISHED') {
      throw ApiError.badRequest('Lowongan ini sudah aktif dan dibayar');
    }

    const orderId = `JP-JOB-${job.id.slice(0, 8)}-${Date.now()}`;
    let snapToken = job.snapToken;

    try {
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
      snapToken = transaction.token;
    } catch (midtransErr) {
      console.warn('[Midtrans Retry Warning]:', midtransErr.message);
    }

    await prisma.job.update({
      where: { id: job.id },
      data: {
        snapToken,
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
      data: { snapToken, orderId },
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/jobs/:id — Edit lowongan kerja
router.put('/:id', auth, authorize('FARMER'), async (req, res, next) => {
  try {
    const job = await prisma.job.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!job) throw ApiError.notFound('Lowongan tidak ditemukan');

    const updateData = { ...req.body };
    if (req.body.offeredSalary) {
      updateData.placementFee = Math.round(req.body.offeredSalary * PLACEMENT_FEE_RATE);
    }

    const updated = await prisma.job.update({
      where: { id: job.id },
      data: updateData,
    });

    return success(res, { message: 'Lowongan kerja berhasil diperbarui', data: updated });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/jobs/:id — Hapus lowongan kerja
router.delete('/:id', auth, authorize('FARMER'), async (req, res, next) => {
  try {
    const job = await prisma.job.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!job) throw ApiError.notFound('Lowongan tidak ditemukan');

    await prisma.$transaction([
      prisma.paymentLog.deleteMany({ where: { jobId: job.id } }),
      prisma.application.deleteMany({ where: { jobId: job.id } }),
      prisma.job.delete({ where: { id: job.id } }),
    ]);

    return success(res, { message: 'Lowongan kerja berhasil dihapus' });
  } catch (error) {
    next(error);
  }
});

// POST /api/jobs/:id/apply — Apply lowongan kerja (Pelajar)
router.post('/:id/apply', auth, authorize('STUDENT'), require('../../middlewares/upload').uploadApplication, async (req, res, next) => {
  try {
    const jobId = req.params.id;
    const studentId = req.user.id;

    const job = await prisma.job.findFirst({
      where: { id: jobId, status: 'PUBLISHED' },
    });
    if (!job) throw ApiError.badRequest('Lowongan kerja tidak aktif atau tidak ditemukan');

    const existing = await prisma.application.findFirst({
      where: { studentId, jobId },
    });
    if (existing) throw ApiError.badRequest('Anda sudah melamar ke lowongan kerja ini');

    if (!req.files?.cv?.[0]) throw ApiError.badRequest('CV wajib diupload');

    const cvFile = req.files.cv[0];
    const { uploadToSupabase } = require('../../utils/fileUpload');
    const cvResult = await uploadToSupabase(cvFile.buffer, cvFile.originalname, 'cv', studentId);

    let portfolioResult = null;
    if (req.files?.portfolio?.[0]) {
      const portfolioFile = req.files.portfolio[0];
      portfolioResult = await uploadToSupabase(portfolioFile.buffer, portfolioFile.originalname, 'portfolios', studentId);
    }

    const application = await prisma.application.create({
      data: {
        type: 'JOB',
        studentId,
        jobId,
        cvUrl: cvResult.url,
        cvPath: cvResult.filePath,
        portfolioUrl: portfolioResult?.url || null,
        portfolioPath: portfolioResult?.filePath || null,
        motivation: req.body.motivation || 'Lamaran Pekerjaan Profesional',
        status: 'REVIEW',
      },
    });

    return success(res, { statusCode: 201, message: 'Lamaran pekerjaan berhasil dikirim', data: application });
  } catch (error) {
    next(error);
  }
});

// GET /api/jobs/:id/applicants — List pendaftar lowongan kerja (Petani)
router.get('/:id/applicants', auth, authorize('FARMER'), async (req, res, next) => {
  try {
    const job = await prisma.job.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!job) throw ApiError.notFound('Lowongan kerja tidak ditemukan');

    const { page, limit, skip } = paginate(req.query);
    const where = { jobId: req.params.id, type: 'JOB' };

    if (req.query.status) where.status = req.query.status;

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, status: true, createdAt: true,
          student: { select: { id: true, fullName: true, institution: true, email: true, phone: true } },
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

// GET /api/jobs/:id/payment-status — Cek status transaksi langsung ke Midtrans API
router.get('/:id/payment-status', auth, authorize('FARMER'), async (req, res, next) => {
  try {
    const job = await prisma.job.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!job) throw ApiError.notFound('Lowongan kerja tidak ditemukan');
    if (!job.orderId) throw ApiError.badRequest('Lowongan belum memiliki order ID transaksi');

    let statusResponse = null;
    try {
      statusResponse = await snap.transaction.notification({ order_id: job.orderId });
    } catch (midtransErr) {
      console.warn('[Midtrans Sandbox Warning]:', midtransErr.message);
    }

    return success(res, {
      data: {
        jobId: job.id,
        orderId: job.orderId,
        status: job.status,
        midtransStatus: statusResponse?.transaction_status || 'pending',
        grossAmount: statusResponse?.gross_amount || String(job.placementFee),
        paymentType: statusResponse?.payment_type || 'bank_transfer',
        transactionTime: statusResponse?.transaction_time || new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
