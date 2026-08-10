const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const { env } = require('./config/env');
const errorHandler = require('./middlewares/errorHandler');
const { apiLimiter } = require('./middlewares/rateLimiter');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));

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
app.use('/api/internships', require('./modules/internship/internship.routes'));
app.use('/api/internships', require('./modules/curriculum/curriculum.routes'));
app.use('/api/internships', require('./modules/application/application.routes'));
app.use('/api/applications', require('./modules/application/application.direct.routes'));
app.use('/api/internships', require('./modules/logbook/logbook.routes'));
app.use('/api/logbook', require('./modules/logbook/logbook.direct.routes'));
app.use('/api/internships', require('./modules/evaluation/evaluation.routes'));
app.use('/api/evaluations', require('./modules/evaluation/evaluation.direct.routes'));
app.use('/api/certificates', require('./modules/certificate/certificate.routes'));
app.use('/api/dashboard', require('./modules/dashboard/dashboard.routes'));
app.use('/api/landing', require('./modules/landing/landing.routes'));
app.use('/api/jobs', require('./modules/job/job.routes'));
app.use('/api/payments', require('./modules/payment/payment.routes'));

// Global error handler (HARUS terakhir)
app.use(errorHandler);

module.exports = app;
