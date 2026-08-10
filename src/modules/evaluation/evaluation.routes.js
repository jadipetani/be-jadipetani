const router = require('express').Router();
const auth = require('../../middlewares/auth');
const authorize = require('../../middlewares/authorize');
const { success } = require('../../utils/apiResponse');
const prisma = require('../../config/database');
const ApiError = require('../../utils/apiError');
const { getGeminiModel } = require('../../config/gemini');
const { sendEmail, graduationEmail } = require('../../utils/emailService');

// GET /api/internships/:internshipId/evaluations/:applicationId
router.get('/:internshipId/evaluations/:applicationId', auth, authorize('FARMER'), async (req, res, next) => {
  try {
    const { internshipId, applicationId } = req.params;

    const application = await prisma.application.findFirst({
      where: {
        id: applicationId,
        internshipId,
        status: { in: ['ACCEPTED', 'GRADUATED'] },
        internship: { userId: req.user.id },
      },
      include: {
        student: { select: { id: true, fullName: true } },
        internship: { select: { id: true, title: true } },
        evaluations: { orderBy: { weekNumber: 'asc' } },
        logbookEntries: {
          orderBy: { weekNumber: 'asc' },
          include: {
            activities: true,
            _count: { select: { documentations: true } },
          },
        },
      },
    });
    if (!application) throw ApiError.notFound('Data evaluasi tidak ditemukan');

    // Merge logbook data into evaluations
    const gradedCount = application.evaluations.filter((e) => e.status === 'GRADED').length;
    const totalWeeks = application.logbookEntries.length;

    const weeks = application.logbookEntries.map((entry) => {
      const evaluation = application.evaluations.find((e) => e.weekNumber === entry.weekNumber);
      const completed = entry.activities.filter((a) => a.isCompleted).length;
      const total = entry.activities.length;

      return {
        id: evaluation?.id || null,
        weekNumber: entry.weekNumber,
        title: entry.title,
        checklistScore: `${completed}/${total}`,
        documentationCount: entry._count.documentations,
        score: evaluation?.score || null,
        notes: evaluation?.notes || null,
        status: evaluation?.status || 'PENDING',
      };
    });

    return success(res, {
      data: {
        student: application.student,
        internship: application.internship,
        overallProgress: `${gradedCount}/${totalWeeks} Minggu (${totalWeeks > 0 ? Math.round((gradedCount / totalWeeks) * 100) : 0}%)`,
        weeks,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/internships/:internshipId/evaluations/:applicationId/ai-summary
router.post('/:internshipId/evaluations/:applicationId/ai-summary', auth, authorize('FARMER'), async (req, res, next) => {
  try {
    const application = await prisma.application.findFirst({
      where: {
        id: req.params.applicationId,
        internshipId: req.params.internshipId,
        internship: { userId: req.user.id },
      },
      include: {
        student: { select: { fullName: true } },
        internship: { select: { title: true, commodity: true, durationWeeks: true } },
        evaluations: { orderBy: { weekNumber: 'asc' } },
        logbookEntries: { orderBy: { weekNumber: 'asc' }, include: { activities: true } },
      },
    });
    if (!application) throw ApiError.notFound();

    const weeklyData = application.logbookEntries.map((entry) => {
      const evaluation = application.evaluations.find((e) => e.weekNumber === entry.weekNumber);
      return {
        weekNumber: entry.weekNumber,
        title: entry.title,
        checklistScore: `${entry.activities.filter((a) => a.isCompleted).length}/${entry.activities.length}`,
        score: evaluation?.score || 'Belum dinilai',
        notes: evaluation?.notes || '',
      };
    });

    const prompt = `Kamu adalah evaluator program magang pertanian. Berdasarkan data penilaian berikut, buatkan ringkasan evaluasi dalam format JSON.

Program: ${application.internship.title}
Komoditas: ${application.internship.commodity}
Peserta: ${application.student.fullName}
Durasi: ${application.internship.durationWeeks} minggu

Data Penilaian per Minggu:
${JSON.stringify(weeklyData, null, 2)}

Format output (JSON):
{
  "overallScore": <rata-rata skor numerik>,
  "mainCompetencies": ["Kompetensi 1", "Kompetensi 2", "Kompetensi 3"],
  "areasForImprovement": ["Area 1", "Area 2"],
  "summary": "Paragraf ringkasan evaluasi keseluruhan"
}

HANYA output JSON, tanpa teks tambahan.`;

    try {
      const model = getGeminiModel();
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON');
      const summaryData = JSON.parse(jsonMatch[0]);

      return success(res, { data: summaryData });
    } catch (aiError) {
      console.error('Gemini AI error:', aiError);
      throw new ApiError(503, 'AI sedang tidak tersedia');
    }
  } catch (error) {
    next(error);
  }
});

// POST /api/internships/:internshipId/evaluations/:applicationId/graduate
router.post('/:internshipId/evaluations/:applicationId/graduate', auth, authorize('FARMER'), async (req, res, next) => {
  try {
    const application = await prisma.application.findFirst({
      where: {
        id: req.params.applicationId,
        internshipId: req.params.internshipId,
        status: 'ACCEPTED',
        internship: { userId: req.user.id },
      },
      include: {
        student: { select: { id: true, fullName: true, email: true } },
        internship: {
          select: {
            title: true, commodity: true, location: true, durationMonths: true,
            user: { select: { fullName: true } },
            curriculumWeeks: { select: { title: true } },
          },
        },
        evaluations: true,
      },
    });
    if (!application) throw ApiError.notFound();
    if (application.evaluations.filter((e) => e.status === 'GRADED').length === 0) {
      throw ApiError.badRequest('Minimal 1 minggu harus sudah dinilai sebelum meluluskan');
    }

    // Update status
    await prisma.application.update({
      where: { id: application.id },
      data: { status: 'GRADUATED' },
    });

    // Generate certificate number
    const year = new Date().getFullYear();
    const count = await prisma.certificate.count();
    const certNumber = `JP-CERT-${year}-${String(count + 1).padStart(4, '0')}`;

    // Extract competencies/skills from curriculum
    const skills = application.internship.curriculumWeeks.map((w) => w.title);

    // Generate PDF and upload to Supabase Storage
    let pdfResult = { pdfUrl: '', pdfPath: '' };
    try {
      const { generateAndUploadCertificate } = require('../../utils/pdfGenerator');
      pdfResult = await generateAndUploadCertificate({
        certificateNumber: certNumber,
        studentName: application.student.fullName,
        internshipTitle: application.internship.title,
        commodity: application.internship.commodity,
        location: application.internship.location,
        durationMonths: application.internship.durationMonths,
        skills,
        farmerName: application.internship.user.fullName,
        issuedDate: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      });
    } catch (pdfErr) {
      console.error('Failed to generate PDF certificate:', pdfErr);
      // Non-fatal — proceed with record creation
    }

    // Create certificate record
    const certificate = await prisma.certificate.create({
      data: {
        certificateNumber: certNumber,
        pdfUrl: pdfResult.pdfUrl,
        pdfPath: pdfResult.pdfPath,
        applicationId: application.id,
        studentId: application.student.id,
      },
    });

    // Send graduation email
    const emailData = graduationEmail(application.student.fullName, application.internship.title, pdfResult.pdfUrl);
    sendEmail({ to: application.student.email, ...emailData });

    return success(res, {
      statusCode: 201,
      message: 'Peserta berhasil diluluskan dan sertifikat telah diterbitkan.',
      data: { certificate },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
