const router = require('express').Router();
const auth = require('../../middlewares/auth');
const authorize = require('../../middlewares/authorize');
const validate = require('../../middlewares/validate');
const { success } = require('../../utils/apiResponse');
const prisma = require('../../config/database');
const ApiError = require('../../utils/apiError');
const { getGeminiModel } = require('../../config/gemini');
const { z } = require('zod');

// === Zod Schema for manual curriculum update ===
const curriculumWeekSchema = z.object({
  weekNumber: z.number().int().min(1),
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  activities: z.array(z.object({
    name: z.string().trim().min(1),
    description: z.string().trim().min(1),
    weight: z.number().int().min(1),
  })).min(1),
});

const updateCurriculumSchema = z.object({
  curriculum: z.array(curriculumWeekSchema).min(1),
});

// POST /api/internships/:id/curriculum/generate — Generate via Gemini AI
router.post('/:id/curriculum/generate', auth, authorize('FARMER'), async (req, res, next) => {
  try {
    const internship = await prisma.internship.findFirst({
      where: { id: req.params.id, userId: req.user.id, deletedAt: null },
    });
    if (!internship) throw ApiError.notFound('Lowongan tidak ditemukan');

    const prompt = `Kamu adalah ahli pertanian Indonesia. Buatkan kurikulum magang pertanian terstruktur dengan format JSON.

Detail program:
- Komoditas: ${internship.commodity}
- Durasi: ${internship.durationWeeks} minggu
- Deskripsi: ${internship.description}

Format output (JSON array):
[
  {
    "weekNumber": 1,
    "title": "Judul Minggu",
    "description": "Deskripsi kegiatan minggu ini",
    "activities": [
      { "name": "Nama aktivitas", "description": "Deskripsi singkat", "weight": 25 }
    ]
  }
]

Rules:
- Total weight per minggu HARUS = 100
- Jumlah minggu HARUS = ${internship.durationWeeks}
- Setiap minggu minimal 3 aktivitas, maksimal 6
- Aktivitas harus progresif (dari dasar ke lanjutan)
- Gunakan bahasa Indonesia
- HANYA output JSON, tanpa teks tambahan`;

    let curriculumData;
    try {
      const model = getGeminiModel();
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('No JSON found in response');
      curriculumData = JSON.parse(jsonMatch[0]);
    } catch (aiError) {
      console.error('Gemini API error:', aiError);
      throw new ApiError(503, 'AI sedang tidak tersedia, silakan coba lagi atau isi kurikulum secara manual');
    }

    // Delete existing curriculum and save new one
    await prisma.curriculumWeek.deleteMany({ where: { internshipId: internship.id } });

    for (const week of curriculumData) {
      await prisma.curriculumWeek.create({
        data: {
          internshipId: internship.id,
          weekNumber: week.weekNumber,
          title: week.title,
          description: week.description,
          activities: {
            create: week.activities.map((a) => ({
              name: a.name,
              description: a.description,
              weight: a.weight,
            })),
          },
        },
      });
    }

    // Fetch saved curriculum
    const saved = await prisma.curriculumWeek.findMany({
      where: { internshipId: internship.id },
      orderBy: { weekNumber: 'asc' },
      include: { activities: true },
    });

    return success(res, {
      message: 'Kurikulum berhasil digenerate',
      data: { curriculum: saved },
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/internships/:id/curriculum — Update/edit manual
router.put('/:id/curriculum', auth, authorize('FARMER'), validate(updateCurriculumSchema), async (req, res, next) => {
  try {
    const internship = await prisma.internship.findFirst({
      where: { id: req.params.id, userId: req.user.id, deletedAt: null },
    });
    if (!internship) throw ApiError.notFound('Lowongan tidak ditemukan');

    // Validate total weight per week = 100
    for (const week of req.body.curriculum) {
      const totalWeight = week.activities.reduce((sum, a) => sum + a.weight, 0);
      if (totalWeight !== 100) {
        throw ApiError.badRequest(`Total bobot minggu ${week.weekNumber} harus 100 (sekarang ${totalWeight})`);
      }
    }

    // Delete existing and recreate
    await prisma.curriculumWeek.deleteMany({ where: { internshipId: internship.id } });

    for (const week of req.body.curriculum) {
      await prisma.curriculumWeek.create({
        data: {
          internshipId: internship.id,
          weekNumber: week.weekNumber,
          title: week.title,
          description: week.description,
          activities: {
            create: week.activities.map((a) => ({
              name: a.name,
              description: a.description,
              weight: a.weight,
            })),
          },
        },
      });
    }

    const saved = await prisma.curriculumWeek.findMany({
      where: { internshipId: internship.id },
      orderBy: { weekNumber: 'asc' },
      include: { activities: true },
    });

    return success(res, { message: 'Kurikulum berhasil diperbarui', data: { curriculum: saved } });
  } catch (error) {
    next(error);
  }
});

// GET /api/internships/:id/curriculum — Preview curriculum (publik)
router.get('/:id/curriculum', async (req, res, next) => {
  try {
    const internship = await prisma.internship.findFirst({
      where: { id: req.params.id, deletedAt: null },
    });
    if (!internship) throw ApiError.notFound('Lowongan tidak ditemukan');

    const curriculum = await prisma.curriculumWeek.findMany({
      where: { internshipId: internship.id },
      orderBy: { weekNumber: 'asc' },
      include: { activities: true },
    });

    return success(res, { data: { curriculum } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
