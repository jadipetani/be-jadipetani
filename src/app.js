const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const { env } = require('./config/env');
const errorHandler = require('./middlewares/errorHandler');
const { apiLimiter } = require('./middlewares/rateLimiter');

const app = express();

// Configure allowed CORS origins
const allowedOrigins = [
  'https://jadipetani.vercel.app',
  'https://be-jadipetani-production.up.railway.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://localhost:5000',
];

if (env.FRONTEND_URL) {
  const cleanEnvFrontend = env.FRONTEND_URL.replace(/\/+$/, '');
  if (!allowedOrigins.includes(cleanEnvFrontend)) {
    allowedOrigins.push(cleanEnvFrontend);
  }
}

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);

    const cleanOrigin = origin.replace(/\/+$/, '');

    if (
      allowedOrigins.includes(cleanOrigin) ||
      /\.vercel\.app$/.test(cleanOrigin) ||
      /\.railway\.app$/.test(cleanOrigin)
    ) {
      return callback(null, true);
    }

    console.warn(`[CORS Blocked] Origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
};

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Global rate limiting
app.use('/api', apiLimiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Jadipetani API is running',
    timestamp: new Date().toISOString(),
  });
});

// Favicon handler
app.get('/favicon.ico', (_req, res) => res.status(204).end());

// Scalar API Documentation UI
const { apiReference } = require('@scalar/express-api-reference');
const openApiSpec = require('./config/swagger');

app.get('/api-spec.json', (_req, res) => res.json(openApiSpec));
app.use(
  '/docs',
  apiReference({
    spec: {
      content: openApiSpec,
    },
    theme: 'purple',
  })
);

// ============================================
// Routes
// ============================================
app.use('/api/auth', require('./modules/auth/auth.routes'));
app.use('/api/users', require('./modules/user/user.routes'));
app.use('/api/internships', require('./modules/curriculum/curriculum.routes'));
app.use('/api/internships', require('./modules/application/application.routes'));
app.use('/api/internships', require('./modules/logbook/logbook.routes'));
app.use('/api/internships', require('./modules/evaluation/evaluation.routes'));
app.use('/api/internships', require('./modules/internship/internship.routes'));
app.use('/api/applications', require('./modules/application/application.direct.routes'));
app.use('/api/logbook', require('./modules/logbook/logbook.direct.routes'));
app.use('/api/evaluations', require('./modules/evaluation/evaluation.direct.routes'));
app.use('/api/certificates', require('./modules/certificate/certificate.routes'));
app.use('/api/dashboard', require('./modules/dashboard/dashboard.routes'));
app.use('/api/landing', require('./modules/landing/landing.routes'));
app.use('/api/jobs', require('./modules/job/job.routes'));
app.use('/api/payments', require('./modules/payment/payment.routes'));
app.use('/api/bookmarks', require('./modules/bookmark/bookmark.routes'));
app.use('/api/my-internships', require('./modules/internship/my-internships.routes'));

// Global error handler (HARUS terakhir)
app.use(errorHandler);

module.exports = app;
