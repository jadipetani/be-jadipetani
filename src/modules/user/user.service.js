const bcrypt = require('bcrypt');
const prisma = require('../../config/database');
const ApiError = require('../../utils/apiError');

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
      createdAt: true,
    },
  });
  if (!user) throw ApiError.notFound('User tidak ditemukan');
  return user;
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
  await prisma.user.delete({ where: { id: userId } });
  return { message: 'Akun berhasil dihapus' };
}

module.exports = { getProfile, updateProfile, changePassword, deleteAccount };
