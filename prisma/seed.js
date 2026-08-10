const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create Farmer
  const farmerPassword = await bcrypt.hash('farmer123', SALT_ROUNDS);
  const farmer = await prisma.user.upsert({
    where: { email: 'petani@jadipetani.com' },
    update: {},
    create: {
      fullName: 'Pak Budi Sugiharto',
      email: 'petani@jadipetani.com',
      password: farmerPassword,
      role: 'FARMER',
      phone: '081234567890',
      address: 'Lembang, Bandung Barat, Jawa Barat',
      institution: 'Kelompok Tani Sugihmakmur',
      bio: 'Petani hortikultura organik berpengetahuan 15 tahun.',
      agreedToTerms: true,
    },
  });
  console.log('✅ Farmer created:', farmer.email);

  // 2. Create Student
  const studentPassword = await bcrypt.hash('student123', SALT_ROUNDS);
  const student = await prisma.user.upsert({
    where: { email: 'pelajar@jadipetani.com' },
    update: {},
    create: {
      fullName: 'Ahmad Rizky',
      email: 'pelajar@jadipetani.com',
      password: studentPassword,
      role: 'STUDENT',
      phone: '089876543210',
      address: 'Bogor, Jawa Barat',
      institution: 'IPB University',
      bio: 'Mahasiswa Agribisnis semester 6 berminat pada pertanian presisi.',
      agreedToTerms: true,
    },
  });
  console.log('✅ Student created:', student.email);

  // 3. Create Internship
  const internship = await prisma.internship.create({
    data: {
      title: 'Magang Budidaya Tomat Organik & Smart Irrigation',
      commodity: 'Tomat Organik',
      location: 'Lembang, Bandung Barat',
      durationMonths: 1,
      durationWeeks: 4,
      quota: 5,
      acceptedCount: 0,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      facilities: 'Akomodasi mes tani, makan siang gratis, alat perlindungan diri',
      description: 'Program magang 1 bulan intensif mempelajari teknik budidaya tomat dari pembenihan hingga panen dengan teknologi penyiraman otomatis.',
      status: 'ACTIVE',
      userId: farmer.id,
      curriculumWeeks: {
        create: [
          {
            weekNumber: 1,
            title: 'Persiapan Lahan & Pembenihan',
            description: 'Mempelajari pengolahan tanah dan persemaian benih tomat berkualitas.',
            activities: {
              create: [
                { name: 'Pengujian pH Tanah & Pemupukan Dasar', description: 'Ukur pH dan campur pupuk kandang', weight: 40 },
                { name: 'Penyemaian Benih di Tray', description: 'Media tanam cocopeat + kompos', weight: 60 },
              ],
            },
          },
          {
            weekNumber: 2,
            title: 'Pindah Tanam & Instalasi Irigasi',
            description: 'Instalasi sistem irigasi tetes dan pindah tanam bibit.',
            activities: {
              create: [
                { name: 'Instalasi Selang Irigasi Tetes', description: 'Pasang pompa & selang drip', weight: 50 },
                { name: 'Pindah Tanam Bibit Usia 14 Hari', description: 'Tanam bibit ke bedengan', weight: 50 },
              ],
            },
          },
          {
            weekNumber: 3,
            title: 'Pemeliharaan & POPT',
            description: 'Pengendalian Hama Penyakit Tanaman secara hayati.',
            activities: {
              create: [
                { name: 'Pemangkasan Tunas Air (Wiwi)', description: 'Pangkas tunas samping', weight: 40 },
                { name: 'Aplikasi Pestisida Nabati', description: 'Semprot larutan neem oil', weight: 60 },
              ],
            },
          },
          {
            weekNumber: 4,
            title: 'Panen & Pascapanen',
            description: 'Pemanenan tomat, grading, dan pengemasan produk.',
            activities: {
              create: [
                { name: 'Pemetikan Buah Tomat Kematangan 80%', description: 'Panen dengan gunting', weight: 50 },
                { name: 'Grading & Packaging Eco-friendly', description: 'Sortir grade A/B dan kemas', weight: 50 },
              ],
            },
          },
        ],
      },
    },
  });
  console.log('✅ Internship created:', internship.title);

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
