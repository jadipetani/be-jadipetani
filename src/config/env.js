const { z } = require('zod');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().trim().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().trim().optional(),
  JWT_ACCESS_SECRET: z.string().trim().min(32, 'JWT_ACCESS_SECRET minimal 32 karakter'),
  JWT_REFRESH_SECRET: z.string().trim().min(32, 'JWT_REFRESH_SECRET minimal 32 karakter'),
  FRONTEND_URL: z.string().trim().min(1).default('http://localhost:5173'),
  ALLOWED_ORIGINS: z.string().trim().optional().default('https://jadipetani.vercel.app,https://be-jadipetani-production.up.railway.app,http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://localhost:5000'),
  SUPABASE_URL: z.string().trim().min(1),
  SUPABASE_SERVICE_KEY: z.string().trim().min(1),
  GEMINI_API_KEY: z.string().trim().min(1),
  MIDTRANS_SERVER_KEY: z.string().trim().min(1),
  MIDTRANS_CLIENT_KEY: z.string().trim().min(1),
  MIDTRANS_IS_PRODUCTION: z.coerce.boolean().default(false),
  RESEND_API_KEY: z.string().trim().min(1),
  SENTRY_DSN: z.string().trim().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

module.exports = { env: parsed.data };
