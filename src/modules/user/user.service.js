const bcrypt = require('bcrypt');
const prisma = require('../../config/database');
const ApiError = require('../../utils/apiError');
const { uploadToSupabase } = require('../../utils/fileUpload');

const SALT_ROUNDS = 12;

async function getProfile(userId) {
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
      avatarUrl: true,
      createdAt: true,
    },
  });
  if (!user) throw ApiError.notFound('User tidak ditemukan');
  return user;
}

async function getProfileCompletion(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound('User tidak ditemukan');

  const fields = ['fullName', 'phone', 'address', 'institution', 'bio', 'avatarUrl'];
  const filledCount = fields.filter((field) => !!user[field]).length;
  const percentage = Math.round((filledCount / fields.length) * 100);

  return {
    completionPercentage: percentage,
    filledFields: filledCount,
    totalFields: fields.length,
    isComplete: percentage === 100,
  };
}

async function uploadAvatar(userId, file) {
  if (!file) throw ApiError.badRequest('File avatar wajib diunggah');

  const uploadResult = await uploadToSupabase(file.buffer, file.originalname, 'avatars', userId);

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl: uploadResult.url },
    select: {
      id: true,
      fullName: true,
      email: true,
      avatarUrl: true,
    },
  });

  return updatedUser;
}

async function updateProfile(userId, data) {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      phone: true,
      address: true,
      institution: true,
      bio: true,
      avatarUrl: true,
      createdAt: true,
    },
  });
  return user;
}

async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound('User tidak ditemukan');

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) throw ApiError.unauthorized('Password lama salah');

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return { message: 'Password berhasil diubah' };
}

async function deleteAccount(userId) {
  await prisma.$transaction(async (tx) => {
    await tx.bookmark.deleteMany({ where: { studentId: userId } });
    await tx.application.deleteMany({ where: { studentId: userId } });
    await tx.job.deleteMany({ where: { userId } });
    await tx.internship.deleteMany({ where: { userId } });
    await tx.user.delete({ where: { id: userId } });
  });
  return { message: 'Akun berhasil dihapus' };
}

module.exports = { getProfile, getProfileCompletion, uploadAvatar, updateProfile, changePassword, deleteAccount };
