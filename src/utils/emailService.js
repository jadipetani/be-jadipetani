const { resend } = require('../config/resend');
const { env } = require('../config/env');

const FROM_EMAIL = 'Jadipetani <onboarding@resend.dev>';

/**
 * Kirim email via Resend
 * Fire-and-forget — gagal kirim TIDAK throw error ke caller
 * @param {Object} options
 * @param {string} options.to - Email penerima
 * @param {string} options.subject - Subject
 * @param {string} options.html - HTML content
 */
async function sendEmail({ to, subject, html }) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error('Email send error:', error);
    // Fire-and-forget: jangan throw
  }
}

// ============================================
// Email Templates
// ============================================

function resetPasswordEmail(name, resetUrl) {
  return {
    subject: 'Reset Password — Jadipetani',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #16A34A;">🌾 Jadipetani</h2>
        <p>Halo ${name},</p>
        <p>Kami menerima permintaan reset password untuk akun Anda.</p>
        <p>Klik tombol di bawah untuk membuat password baru:</p>
        <a href="${resetUrl}" style="display: inline-block; background: #16A34A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0; font-weight: bold;">
          Reset Password
        </a>
        <p style="color: #666; font-size: 14px;">Link ini berlaku selama 1 jam. Jika Anda tidak meminta reset password, abaikan email ini.</p>
      </div>
    `,
  };
}

function applicationAcceptedEmail(name, internshipTitle, farmerName) {
  return {
    subject: `Selamat! Lamaran Magang Anda Diterima — ${internshipTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #16A34A;">🌾 Jadipetani</h2>
        <p>Halo ${name},</p>
        <p>Selamat! 🎉 Lamaran magang Anda untuk program <strong>${internshipTitle}</strong> telah <strong>diterima</strong> oleh ${farmerName}.</p>
        <p>Silakan login ke Jadipetani untuk melihat detail program dan mulai mengisi AI Logbook Anda.</p>
        <a href="${env.FRONTEND_URL}/dashboard" style="display: inline-block; background: #16A34A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0; font-weight: bold;">
          Buka Dashboard
        </a>
      </div>
    `,
  };
}

function applicationRejectedEmail(name, internshipTitle) {
  return {
    subject: `Update Lamaran Magang — ${internshipTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #16A34A;">🌾 Jadipetani</h2>
        <p>Halo ${name},</p>
        <p>Terima kasih atas minat Anda pada program <strong>${internshipTitle}</strong>.</p>
        <p>Sayangnya, lamaran Anda belum dapat diterima untuk saat ini. Jangan berkecil hati — masih banyak kesempatan magang lain yang tersedia di Jadipetani!</p>
        <a href="${env.FRONTEND_URL}/explore" style="display: inline-block; background: #16A34A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0; font-weight: bold;">
          Lihat Lowongan Lain
        </a>
      </div>
    `,
  };
}

function internshipCancelledEmail(name, internshipTitle) {
  return {
    subject: `Lowongan Magang Dibatalkan — ${internshipTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #16A34A;">🌾 Jadipetani</h2>
        <p>Halo ${name},</p>
        <p>Kami informasikan bahwa lowongan magang <strong>${internshipTitle}</strong> yang Anda lamar telah dibatalkan oleh pemberi program.</p>
        <p>Silakan cari lowongan magang lain yang tersedia di platform.</p>
      </div>
    `,
  };
}

function graduationEmail(name, internshipTitle, certificateUrl) {
  return {
    subject: `Selamat Lulus! Sertifikat Magang Anda Siap — ${internshipTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #16A34A;">🌾 Jadipetani</h2>
        <p>Halo ${name},</p>
        <p>Selamat! 🎓 Anda telah dinyatakan <strong>lulus</strong> dari program magang <strong>${internshipTitle}</strong>.</p>
        <p>Sertifikat digital Anda sudah siap diunduh:</p>
        <a href="${certificateUrl}" style="display: inline-block; background: #16A34A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0; font-weight: bold;">
          Download Sertifikat
        </a>
      </div>
    `,
  };
}

function paymentConfirmationEmail(name, jobTitle, amount) {
  return {
    subject: `Pembayaran Berhasil — ${jobTitle} Telah Tayang`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #16A34A;">🌾 Jadipetani</h2>
        <p>Halo ${name},</p>
        <p>Pembayaran Placement Fee sebesar <strong>Rp ${amount.toLocaleString('id-ID')}</strong> untuk lowongan <strong>${jobTitle}</strong> telah berhasil.</p>
        <p>Lowongan Anda sekarang sudah <strong>tayang</strong> dan dapat dilamar oleh pencari kerja.</p>
      </div>
    `,
  };
}

function paymentReminderEmail(name, jobTitle) {
  return {
    subject: `Reminder: Selesaikan Pembayaran — ${jobTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #16A34A;">🌾 Jadipetani</h2>
        <p>Halo ${name},</p>
        <p>Lowongan <strong>${jobTitle}</strong> Anda belum selesai pembayarannya.</p>
        <p><strong>Batas waktu: 1 jam lagi.</strong> Jika tidak diselesaikan, lowongan akan otomatis kedaluwarsa.</p>
        <a href="${env.FRONTEND_URL}/dashboard/jobs" style="display: inline-block; background: #B45309; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0; font-weight: bold;">
          Selesaikan Pembayaran
        </a>
      </div>
    `,
  };
}

module.exports = {
  sendEmail,
  resetPasswordEmail,
  applicationAcceptedEmail,
  applicationRejectedEmail,
  internshipCancelledEmail,
  graduationEmail,
  paymentConfirmationEmail,
  paymentReminderEmail,
};
