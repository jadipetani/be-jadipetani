const { z } = require('zod');

const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().max(20).optional(),
  address: z.string().trim().max(300).optional(),
  institution: z.string().trim().max(200).optional(),
  bio: z.string().trim().max(500).optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Password lama wajib diisi'),
  newPassword: z.string().min(8, 'Password baru minimal 8 karakter'),
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'Konfirmasi password tidak cocok',
  path: ['confirmNewPassword'],
});

module.exports = { updateProfileSchema, changePasswordSchema };
