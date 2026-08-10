/**
 * Application-wide constants and enum values
 * Matching Prisma enums defined in schema.prisma
 */

const Role = {
  FARMER: 'FARMER',
  STUDENT: 'STUDENT',
};

const InternshipStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  CLOSED: 'CLOSED',
  DELETED: 'DELETED',
};

const ApplicationStatus = {
  REVIEW: 'REVIEW',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
  GRADUATED: 'GRADUATED',
};

const ApplicationType = {
  INTERNSHIP: 'INTERNSHIP',
  JOB: 'JOB',
};

const LogbookStatus = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
};

const EvaluationStatus = {
  PENDING: 'PENDING',
  GRADED: 'GRADED',
};

const JobStatus = {
  UNPAID: 'UNPAID',
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  PUBLISHED: 'PUBLISHED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  EXPIRED: 'EXPIRED',
  CLOSED: 'CLOSED',
};

// Duration mapping: 1 month = 4 weeks
const WEEKS_PER_MONTH = 4;

// File upload limits
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_PDF_TYPES = ['application/pdf'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png'];

// Application limits
const MAX_ACTIVE_APPLICATIONS = 5;

// Motivation max length
const MAX_MOTIVATION_LENGTH = 500;

// Placement fee rate
const PLACEMENT_FEE_RATE = 0.5;
const MIN_OFFERED_SALARY = 1000000; // Rp 1.000.000

module.exports = {
  Role,
  InternshipStatus,
  ApplicationStatus,
  ApplicationType,
  LogbookStatus,
  EvaluationStatus,
  JobStatus,
  WEEKS_PER_MONTH,
  MAX_FILE_SIZE,
  ALLOWED_PDF_TYPES,
  ALLOWED_IMAGE_TYPES,
  MAX_ACTIVE_APPLICATIONS,
  MAX_MOTIVATION_LENGTH,
  PLACEMENT_FEE_RATE,
  MIN_OFFERED_SALARY,
};
