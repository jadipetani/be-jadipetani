const router = require('express').Router();
const crypto = require('crypto');
const auth = require('../../middlewares/auth');
const authorize = require('../../middlewares/authorize');
const { success } = require('../../utils/apiResponse');
const prisma = require('../../config/database');
const { env } = require('../../config/env');
const { snap } = require('../../config/midtrans');
const ApiError = require('../../utils/apiError');
const { sendEmail, paymentConfirmationEmail } = require('../../utils/emailService');

// POST /api/payments/midtrans/callback — Webhook Handler (NO auth, MUST verify signature)
router.post('/midtrans/callback', async (req, res, next) => {
  try {
    const payload = req.body;
    const { order_id, status_code, gross_amount, signature_key, transaction_status } = payload;

    if (!order_id || !status_code || !gross_amount || !signature_key || !transaction_status) {
      throw ApiError.badRequest('Invalid webhook payload format');
    }

    // 1. Signature Verification (SECURITY CRITICAL)
    const expectedSignature = crypto
      .createHash('sha512')
      .update(order_id + status_code + gross_amount + env.MIDTRANS_SERVER_KEY)
      .digest('hex');

    if (signature_key !== expectedSignature) {
      console.error(`[MIDTRANS WEBHOOK] Invalid signature key for order ${order_id}`);
      throw ApiError.unauthorized('Invalid webhook signature');
    }

    // 2. Idempotency Check
    const existingLog = await prisma.paymentLog.findFirst({
      where: { orderId: order_id, status: transaction_status },
    });
    if (existingLog) {
      return res.status(200).json({ success: true, message: 'Notification already processed' });
    }

    // 3. Find Job by orderId
    const job = await prisma.job.findFirst({
      where: { orderId: order_id },
      include: { user: { select: { fullName: true, email: true } } },
    });

    if (!job) {
      console.error(`[MIDTRANS WEBHOOK] Job not found for orderId ${order_id}`);
      throw ApiError.notFound('Job order not found');
    }

    // 4. Update status based on transaction_status
    let newJobStatus = job.status;

    switch (transaction_status) {
      case 'settlement':
      case 'capture':
        newJobStatus = 'PUBLISHED';
        break;

      case 'pending':
        newJobStatus = 'PENDING_PAYMENT';
        break;

      case 'expire':
      case 'cancel':
      case 'deny':
        newJobStatus = 'PAYMENT_FAILED';
        break;

      default:
        break;
    }

    await prisma.$transaction(async (tx) => {
      // Update job status
      await tx.job.update({
        where: { id: job.id },
        data: { status: newJobStatus },
      });

      // Insert payment log
      await tx.paymentLog.create({
        data: {
          jobId: job.id,
          orderId: order_id,
          amount: Math.round(parseFloat(gross_amount)),
          status: transaction_status,
          rawPayload: JSON.stringify(payload),
        },
      });
    });

    // 5. Send confirmation email on successful payment
    if (newJobStatus === 'PUBLISHED' && job.status !== 'PUBLISHED') {
      const emailData = paymentConfirmationEmail(
        job.user.fullName,
        job.title,
        job.placementFee
      );
      sendEmail({ to: job.user.email, ...emailData });
    }

    return res.status(200).json({ success: true, message: 'Notification received and processed' });
  } catch (error) {
    next(error);
  }
});

// POST /api/payments/midtrans/reconcile — Manual Reconciliation (Fallback)
router.post('/midtrans/reconcile', auth, authorize('FARMER'), async (req, res, next) => {
  try {
    const { orderId } = req.body;
    if (!orderId) throw ApiError.badRequest('orderId wajib diisi');

    const job = await prisma.job.findFirst({
      where: { orderId, userId: req.user.id },
    });
    if (!job) throw ApiError.notFound('Lowongan tidak ditemukan');

    // Query Midtrans API for transaction status
    let statusResponse;
    try {
      statusResponse = await snap.transaction.notification({ order_id: orderId });
    } catch (midtransErr) {
      throw ApiError.badRequest('Gagal mengecek status ke Midtrans: ' + midtransErr.message);
    }

    const { transaction_status, gross_amount } = statusResponse;

    let newStatus = job.status;
    if (['settlement', 'capture'].includes(transaction_status)) {
      newStatus = 'PUBLISHED';
    } else if (['expire', 'cancel', 'deny'].includes(transaction_status)) {
      newStatus = 'PAYMENT_FAILED';
    }

    await prisma.job.update({
      where: { id: job.id },
      data: { status: newStatus },
    });

    await prisma.paymentLog.create({
      data: {
        jobId: job.id,
        orderId,
        amount: Math.round(parseFloat(gross_amount || job.placementFee)),
        status: transaction_status,
        rawPayload: JSON.stringify(statusResponse),
      },
    });

    return success(res, {
      message: 'Rekonsiliasi berhasil',
      data: { orderId, newStatus, transactionStatus: transaction_status },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
