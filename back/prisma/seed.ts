import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with multi-language support...');

  // ─── Admin user ───────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: 'admin@tripuz.uz' },
    update: {},
    create: {
      email: 'admin@tripuz.uz',
      name: 'Tripuz Admin',
      avatar: 'https://ui-avatars.com/api/?name=Admin&background=6366f1&color=fff',
      role: Role.ADMIN,
    },
  });
  console.log('✅ Admin created:', admin.email);

  // ─── Guide user ───────────────────────────────────────────────
  const guide = await prisma.user.upsert({
    where: { email: 'guide@tripuz.uz' },
    update: {},
    create: {
      email: 'guide@tripuz.uz',
      name: 'Samarqand Gidi - Jasur',
      avatar: 'https://ui-avatars.com/api/?name=Jasur&background=10b981&color=fff',
      role: Role.GUIDE,
    },
  });
  console.log('✅ Guide created:', guide.email);

  // ─── Tourist user ─────────────────────────────────────────────
  const tourist = await prisma.user.upsert({
    where: { email: 'tourist@example.com' },
    update: {},
    create: {
      email: 'tourist@example.com',
      name: 'Ali Valiyev',
      avatar: 'https://ui-avatars.com/api/?name=Ali&background=f59e0b&color=fff',
      role: Role.TOURIST,
    },
  });
  console.log('✅ Tourist created:', tourist.email);

  // Clear existing experiences to re-seed cleanly
  await prisma.availableDate.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.experience.deleteMany({});

  // ─── Experience 1: Registon (Multi-language) ──────────────────
  const exp1 = await prisma.experience.create({
    data: {
      id: 'exp-registon-001',
      title: JSON.stringify({
        uz: "Registon maydoni va Ulug'bek rasadxonasi bilan tanishuv",
        ru: 'Знакомство с площадью Регистан и обсерваторией Улугбека',
        en: 'Discover Registan Square & Ulugh Beg Observatory',
      }),
      description: JSON.stringify({
        uz: "Samarqandning qalbi hisoblangan Registon maydoni, uning uchta ulug'vor madrasasi va astronomik Ulugbek rasadxonasiga professional gid bilan sayohat.",
        ru: 'Экскурсия с профессиональным гидом по площади Регистан — сердцу Самарканда, с её тремя величественными медресе и обсерваторией Улугбека.',
        en: 'Guided tour through the heart of Samarkand: Registan Square with its three majestic madrasahs and the historical Ulugh Beg Observatory.',
      }),
      city: JSON.stringify({
        uz: 'Samarqand',
        ru: 'Самарканд',
        en: 'Samarkand',
      }),
      price: 150000,
      duration: '4 hours',
      meetingPoint: JSON.stringify({
        uz: "Registon maydoni, bosh darvoza (Sharq tomoni)",
        ru: 'Площадь Регистан, главные ворота (восточная сторона)',
        en: 'Registan Square main gate (East side)',
      }),
      images: JSON.stringify([
        'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Registan_Samarkand.jpg/1200px-Registan_Samarkand.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Bibi-Khanym_Mosque.jpg/1280px-Bibi-Khanym_Mosque.jpg',
      ]),
      guideId: guide.id,
    },
  });
  console.log('✅ Experience 1 (Registon) created with 3 languages');

  // ─── Experience 2: Shoh-i-Zinda (Multi-language) ──────────────
  const exp2 = await prisma.experience.create({
    data: {
      id: 'exp-shahizinda-002',
      title: JSON.stringify({
        uz: "Shoh-i-Zinda nekropolisi va Bibixonim masjidi sayohati",
        ru: 'Экскурсия по некрополю Шахи-Зинда и мечети Биби-Ханым',
        en: 'Shah-i-Zinda Necropolis & Bibi-Khanym Mosque Walking Tour',
      }),
      description: JSON.stringify({
        uz: "Samarqandning eng muhim tarixiy obidalaridan biri bo'lgan Shoh-i-Zinda — tirik shohlar maqbaralari majmuasi bilan tanishing.",
        ru: 'Посетите некрополь Шахи-Зинда — уникальный ансамбль мавзолеев с мозаикой всех оттенков синего и голубого цвета.',
        en: 'Explore Shah-i-Zinda, the stunning avenue of mausoleums featuring intricate blue tilework and centuries of sacred history.',
      }),
      city: JSON.stringify({
        uz: 'Samarqand',
        ru: 'Самарканд',
        en: 'Samarkand',
      }),
      price: 120000,
      duration: '3 hours',
      meetingPoint: JSON.stringify({
        uz: "Shoh-i-Zinda yo'li, asosiy kirish darvozasi",
        ru: 'Улица Шахи-Зинда, главный вход',
        en: 'Shah-i-Zinda street, main entrance',
      }),
      images: JSON.stringify([
        'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Shah-i-Zinda_1.jpg/1280px-Shah-i-Zinda_1.jpg',
      ]),
      guideId: guide.id,
    },
  });
  console.log('✅ Experience 2 (Shoh-i-Zinda) created with 3 languages');

  // ─── Available dates for Experience 1 ────────────────────────
  const dates = [
    new Date('2026-09-15T09:00:00Z'),
    new Date('2026-09-16T09:00:00Z'),
    new Date('2026-09-17T14:00:00Z'),
  ];
  for (const date of dates) {
    await prisma.availableDate.create({
      data: { experienceId: exp1.id, date, slots: 12 },
    });
  }

  // ─── Available dates for Experience 2 ────────────────────────
  const dates2 = [
    new Date('2026-09-14T10:00:00Z'),
    new Date('2026-09-18T10:00:00Z'),
  ];
  for (const date of dates2) {
    await prisma.availableDate.create({
      data: { experienceId: exp2.id, date, slots: 8 },
    });
  }

  console.log('\n🎉 Multi-language Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
