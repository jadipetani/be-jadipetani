const { z } = require('zod');

const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'Nama minimal 2 karakter').max(100, 'Nama maksimal 100 karakter'),
  email: z.string().trim().email('Format email tidak valid').toLowerCase(),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  confirmPassword: z.string(),
  role: z.enum(['FARMER', 'STUDENT'], { message: 'Role harus FARMER atau STUDENT' }),
  agreedToTerms: z.literal(true, {
    errorMap: () => ({ message: 'Harus menyetujui Syarat & Ketentuan' }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Konfirmasi password tidak cocok',
  path: ['confirmPassword'],
});

const loginSchema = z.object({
  email: z.string().trim().email('Format email tidak valid').toLowerCase(),
  password: z.string().min(1, 'Password wajib diisi'),
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Format email tidak valid').toLowerCase(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token wajib diisi'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Konfirmasi password tidak cocok',
  path: ['confirmPassword'],
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
