const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../../config/database');
const { env } = require('../../config/env');
const ApiError = require('../../utils/apiError');
const { sendEmail, resetPasswordEmail } = require('../../utils/emailService');

const SALT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = '1h';
const REFRESH_TOKEN_EXPIRY = '30d';
const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

/**
 * Generate JWT access token
 */
function generateAccessToken(userId, role) {
  return jwt.sign({ userId, role }, env.JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

/**
 * Generate JWT refresh token
 */
function generateRefreshToken(userId, role) {
  return jwt.sign({ userId, role }, env.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
}

/**
 * Register new user
 */
async function register({ fullName, email, password, role, agreedToTerms }) {
  // Check email uniqueness
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw ApiError.conflict('Email sudah terdaftar');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // Create user
  const user = await prisma.user.create({
    data: {
      fullName,
      email,
      password: hashedPassword,
      role,
      agreedToTerms,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  // Generate tokens
  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id, user.role);

  return { user, accessToken, refreshToken };
}

/**
 * Login user
 */
async function login({ email, password }) {
  // Find user - generic error for both email not found and wrong password
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw ApiError.unauthorized('Email atau password salah');
  }

  // Compare password
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw ApiError.unauthorized('Email atau password salah');
  }

  // Generate tokens
  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id, user.role);

  return {
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    },
    accessToken,
    refreshToken,
  };
}

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken(refreshTokenValue) {
  if (!refreshTokenValue) {
    throw ApiError.unauthorized('Refresh token tidak ditemukan');
  }

  try {
    const decoded = jwt.verify(refreshTokenValue, env.JWT_REFRESH_SECRET);

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true },
    });

    if (!user) {
      throw ApiError.unauthorized('User tidak ditemukan');
    }

    const accessToken = generateAccessToken(user.id, user.role);
    return { accessToken };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.unauthorized('Refresh token tidak valid atau sudah kedaluwarsa');
  }
}

/**
 * Get current user profile
 */
async function getMe(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      phone: true,
      address: true,
      institution: true,
      bio: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw ApiError.notFound('User tidak ditemukan');
  }

  return user;
}

/**
 * Forgot password — send reset email
 * ALWAYS returns success (never reveals if email exists)
 */
async function forgotPassword(email) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    // Generate reset token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashedToken,
        resetTokenExpiry: new Date(Date.now() + RESET_TOKEN_EXPIRY_MS),
      },
    });

    // Send reset email
    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${rawToken}`;
    const emailData = resetPasswordEmail(user.fullName, resetUrl);
    await sendEmail({ to: user.email, ...emailData });
  }

  // Always return same response
  return { message: 'Jika email terdaftar, kami akan mengirimkan link reset password' };
}

/**
 * Reset password with token
 */
async function resetPassword({ token, password }) {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await prisma.user.findFirst({
    where: {
      resetToken: hashedToken,
      resetTokenExpiry: { gt: new Date() },
    },
  });

  if (!user) {
    throw ApiError.badRequest('Token tidak valid atau sudah kedaluwarsa');
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  return { message: 'Password berhasil diubah' };
}

module.exports = {
  register,
  login,
  refreshAccessToken,
  getMe,
  forgotPassword,
  resetPassword,
};
