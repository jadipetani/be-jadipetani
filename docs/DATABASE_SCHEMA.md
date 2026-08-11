# Database Schema — Jadipetani Backend (Prisma)

> Referensi cepat untuk schema database. Gunakan ini sebagai acuan saat membuat `prisma/schema.prisma`.

---

## Entity Relationship Overview

```
User ──< Internship ──< Curriculum Week ──< Activity
  │         │
  │         └──< Application ──< LogbookEntry ──< LogbookDoc
  │                   │              │
  │                   └──< Evaluation (per week)
  │                   │
  │                   └── Certificate
  │
  └──< Job ──< PaymentLog
         │
         └──< JobApplication
```

---

## Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================
// ENUMS
// ============================

enum Role {
  FARMER
  STUDENT
}

enum InternshipStatus {
  DRAFT
  ACTIVE
  CLOSED
  DELETED
}

enum ApplicationStatus {
  REVIEW
  ACCEPTED
  REJECTED
  CANCELLED
  GRADUATED
}

enum ApplicationType {
  INTERNSHIP
  JOB
}

enum LogbookStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED
}

enum EvaluationStatus {
  PENDING
  GRADED
}

enum JobStatus {
  UNPAID
  PENDING_PAYMENT
  PUBLISHED
  PAYMENT_FAILED
  EXPIRED
  CLOSED
}

// ============================
// MODELS
// ============================

model User {
  id            String    @id @default(uuid())
  fullName      String
  email         String    @unique
  password      String
  role          Role
  phone         String?
  address       String?
  institution   String?   // untuk STUDENT
  bio           String?
  agreedToTerms Boolean   @default(false)

  // Reset password
  resetToken       String?
  resetTokenExpiry DateTime?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  internships   Internship[]
  applications  Application[]
  certificates  Certificate[]
  jobs          Job[]

  @@map("users")
}

model Internship {
  id             String           @id @default(uuid())
  title          String
  commodity      String
  location       String
  durationMonths Int
  durationWeeks  Int              // = durationMonths × 4
  quota          Int
  acceptedCount  Int              @default(0)
  deadline       DateTime
  facilities     String?
  description    String           @db.Text
  status         InternshipStatus @default(DRAFT)

  // Soft delete
  deletedAt DateTime?

  // Owner
  userId String
  user   User   @relation(fields: [userId], references: [id])

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  curriculumWeeks CurriculumWeek[]
  applications    Application[]

  @@map("internships")
}

model CurriculumWeek {
  id          String @id @default(uuid())
  weekNumber  Int
  title       String
  description String @db.Text

  // Parent
  internshipId String
  internship   Internship @relation(fields: [internshipId], references: [id], onDelete: Cascade)

  // Relations
  activities CurriculumActivity[]

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([internshipId, weekNumber])
  @@map("curriculum_weeks")
}

model CurriculumActivity {
  id          String @id @default(uuid())
  name        String
  description String
  weight      Int    // Bobot poin (total per week = 100)

  // Parent
  curriculumWeekId String
  curriculumWeek   CurriculumWeek @relation(fields: [curriculumWeekId], references: [id], onDelete: Cascade)

  // Relations
  logbookActivities LogbookActivity[]

  @@map("curriculum_activities")
}

model Application {
  id           String            @id @default(uuid())
  type         ApplicationType   @default(INTERNSHIP)
  cvUrl        String
  cvPath       String            // Path di Supabase Storage
  portfolioUrl String?
  portfolioPath String?
  motivation   String
  status       ApplicationStatus @default(REVIEW)

  // Relations
  studentId    String
  student      User       @relation(fields: [studentId], references: [id])
  internshipId String?
  internship   Internship? @relation(fields: [internshipId], references: [id])
  jobId        String?
  job          Job?        @relation(fields: [jobId], references: [id])

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  logbookEntries LogbookEntry[]
  evaluations    Evaluation[]
  certificate    Certificate?

  @@unique([studentId, internshipId])
  @@unique([studentId, jobId])
  @@map("applications")
}

model LogbookEntry {
  id                   String       @id @default(uuid())
  weekNumber           Int
  title                String
  description          String       @db.Text
  status               LogbookStatus @default(NOT_STARTED)
  completionPercentage Float        @default(0)
  reflection           String?      @db.Text

  // Parent
  applicationId String
  application   Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)

  // Relations
  activities     LogbookActivity[]
  documentations LogbookDocumentation[]

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([applicationId, weekNumber])
  @@map("logbook_entries")
}

model LogbookActivity {
  id          String  @id @default(uuid())
  name        String
  description String
  weight      Int
  isCompleted Boolean @default(false)

  // Parent
  logbookEntryId     String
  logbookEntry       LogbookEntry       @relation(fields: [logbookEntryId], references: [id], onDelete: Cascade)
  curriculumActivityId String?
  curriculumActivity   CurriculumActivity? @relation(fields: [curriculumActivityId], references: [id])

  @@map("logbook_activities")
}

model LogbookDocumentation {
  id       String @id @default(uuid())
  url      String
  filePath String // Path di Supabase Storage

  // Parent
  logbookEntryId String
  logbookEntry   LogbookEntry @relation(fields: [logbookEntryId], references: [id], onDelete: Cascade)

  // Timestamps
  createdAt DateTime @default(now())

  @@map("logbook_documentations")
}

model Evaluation {
  id                 String           @id @default(uuid())
  weekNumber         Int
  checklistCompleted Int              @default(0)
  checklistTotal     Int              @default(0)
  documentationCount Int              @default(0)
  score              Int?             // 1-100, diisi petani
  notes              String?          @db.Text
  status             EvaluationStatus @default(PENDING)

  // Parent
  applicationId String
  application   Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([applicationId, weekNumber])
  @@map("evaluations")
}

model Certificate {
  id                String @id @default(uuid())
  certificateNumber String @unique // Format: JP-CERT-{year}-{sequential}
  pdfUrl            String
  pdfPath           String // Path di Supabase Storage

  // AI Summary (snapshot)
  overallScore       Float?
  mainCompetencies   String[]
  areasForImprovement String[]
  summary            String?  @db.Text

  // Relations
  applicationId String      @unique
  application   Application @relation(fields: [applicationId], references: [id])
  studentId     String
  student       User        @relation(fields: [studentId], references: [id])

  // Timestamps
  issuedAt  DateTime @default(now())
  createdAt DateTime @default(now())

  @@map("certificates")
}

// ============================
// JOB CONNECTOR (Fase berikutnya)
// ============================

model Job {
  id             String    @id @default(uuid())
  title          String
  location       String
  description    String    @db.Text
  qualifications String    @db.Text
  offeredSalary  Int       // Rupiah
  placementFee   Int       // = offeredSalary × 0.5
  status         JobStatus @default(UNPAID)

  // Payment
  orderId   String?  @unique
  snapToken String?

  // Owner
  userId String
  user   User   @relation(fields: [userId], references: [id])

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  applications Application[]
  paymentLogs  PaymentLog[]

  @@map("jobs")
}

model PaymentLog {
  id         String @id @default(uuid())
  orderId    String
  amount     Int
  status     String // settlement, pending, expire, cancel, deny
  rawPayload String? @db.Text // JSON string payload webhook

  // Parent
  jobId String
  job   Job    @relation(fields: [jobId], references: [id])

  // Timestamps
  createdAt DateTime @default(now())

  @@index([orderId, status])
  @@map("payment_logs")
}
```

---

## Notes

- **UUID** digunakan sebagai primary key (bukan integer auto-increment) untuk keamanan (tidak bisa diiterasi)
- **Soft delete** pada Internship via `deletedAt` field
- **Application** punya polymorphic relation (bisa ke Internship atau Job via type + nullable FK)
- **Unique constraints** mencegah duplikat: `[studentId, internshipId]`, `[applicationId, weekNumber]`
- **Cascade delete**: hapus curriculum week → hapus activities; hapus logbook entry → hapus activities & docs
- **Index** pada `[orderId, status]` di PaymentLog untuk idempotency check
