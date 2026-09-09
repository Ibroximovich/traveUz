import { BookingStatus, PaymentStatus, Role } from '@prisma/client';
import prisma from '../config/prisma';
import { env } from '../config/env';
import { HttpError } from '../middlewares/error.middleware';
import { UpdateBookingStatusDto } from '../schemas/booking.schema';
import { mockBookingsStore } from './booking.service';
import {
  CreateGuideExperienceDto,
  UpdateGuideExperienceDto,
  AddAvailableDateDto,
  UpdateGuideProfileDto,
} from '../schemas/experience.schema';

const USD_TO_UZS_RATE = 12800;

/**
 * Ensure guide User record exists in DB to prevent foreign key errors on Experience creation.
 * Strictly uses the passed guideId for proper tenant isolation.
 */
async function ensureGuideUserExists(guideId: string) {
  try {
    const user = await prisma.user.findUnique({ where: { id: guideId } });
    if (!user) {
      const slug = guideId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
      await prisma.user.upsert({
        where: { id: guideId },
        update: { role: Role.GUIDE },
        create: {
          id: guideId,
          email: `guide-${slug}@tripuz.uz`,
          name: 'Gid Foydalanuvchi',
          role: Role.GUIDE,
        },
      });
    }
  } catch (err) {
    console.warn('Could not ensure guide user in DB:', err);
  }
}

// In-memory Dev Store for instant testing when DB is offline.
// Notice: initial mock experiences belong strictly to 'google-mock-guide-123'
export const mockExperiencesStore: any[] = [
  {
    id: 'exp-mock-1',
    title: "Samarqand Registon va Afrosiyob Bo'ylab Tarixiy Sayohat",
    title_uz: "Samarqand Registon va Afrosiyob Bo'ylab Tarixiy Sayohat",
    title_en: "Historical Tour of Samarkand Registan & Afrasiab",
    title_ru: "Исторический тур по Самарканду: Регистан и Афрасиаб",
    description: "Samarqandning durdonasi bo'lmish Registon maydoni, Gur-Amir maqbarasi hamda qadimiy Afrosiyob muzeyiga maxsus mualliflik ekskursiyasi.",
    description_uz: "Samarqandning durdonasi bo'lmish Registon maydoni, Gur-Amir maqbarasi hamda qadimiy Afrosiyob muzeyiga maxsus mualliflik ekskursiyasi.",
    description_en: "Author's special guided tour through the pearl of Samarkand: Registan Square, Gur-e-Amir Mausoleum, and the ancient Afrasiab Museum.",
    description_ru: "Авторская экскурсия по жемчужине Самарканда: площади Регистан, мавзолею Гур-Эмир и древнему музею Афрасиаб.",
    city: 'Samarqand',
    price: 25,
    priceUsd: 25,
    priceUzs: 320000,
    durationHours: 3,
    duration: '3 soat',
    meetingPoint: 'Registon maydoni markaziy kassa oldi',
    meetingPointText: 'Registon maydoni markaziy kassa oldi',
    meetingPointText_uz: 'Registon maydoni markaziy kassa oldi',
    meetingPointText_en: 'In front of Registan Square main ticket box',
    meetingPointText_ru: 'Перед центральной кассой площади Регистан',
    languages: ["O'zbekcha", 'Ruscha', 'Inglizcha'],
    images: ['https://images.unsplash.com/photo-1590076215667-873d96c8913c?auto=format&fit=crop&w=800&q=80'],
    isActive: true,
    guideId: 'google-mock-guide-123',
    guide: { id: 'google-mock-guide-123', name: 'Samarqand Gidi - Jasur', avatar: null, email: 'guide@tripuz.uz' },
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { bookings: 5, availableDates: 2 },
    availableDates: [
      { id: 'date-mock-1', experienceId: 'exp-mock-1', date: new Date(Date.now() + 86400000), slots: 8 },
      { id: 'date-mock-2', experienceId: 'exp-mock-1', date: new Date(Date.now() + 172800000), slots: 10 },
    ],
  },
  {
    id: 'exp-mock-2',
    title: "Buxoro Ko'hna Shahar va Ark Qal'asi Turi",
    title_uz: "Buxoro Ko'hna Shahar va Ark Qal'asi Turi",
    title_en: "Bukhara Old City & Ark Citadel Walking Tour",
    title_ru: "Пешая экскурсия по Старому городу Бухары и крепости Арк",
    description: "Ipak yo'li yuragi bo'lmish Buxoro shahrining qadimiy minorasi, Labi Hovuz va Ark qal'asiga unutilmas sayohat.",
    description_uz: "Ipak yo'li yuragi bo'lmish Buxoro shahrining qadimiy minorasi, Labi Hovuz va Ark qal'asiga unutilmas sayohat.",
    description_en: "An unforgettable journey to the ancient minaret, Lyabi-Hauz, and the Ark Citadel in the heart of the Silk Road — Bukhara.",
    description_ru: "Незабываемое путешествие к древнему минарету, Ляби-Хауз и крепости Арк в сердце Шелкового пути — Бухаре.",
    city: 'Buxoro',
    price: 30,
    priceUsd: 30,
    priceUzs: 384000,
    durationHours: 4,
    duration: '4 soat',
    meetingPoint: 'Labi Hovuz ansambli',
    meetingPointText: 'Labi Hovuz ansambli',
    meetingPointText_uz: 'Labi Hovuz ansambli',
    meetingPointText_en: 'Lyabi-Hauz Ensemble',
    meetingPointText_ru: 'Ансамбль Ляби-Хауз',
    languages: ["O'zbekcha", 'Inglizcha'],
    images: ['https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?auto=format&fit=crop&w=800&q=80'],
    isActive: true,
    guideId: 'google-mock-guide-123',
    guide: { id: 'google-mock-guide-123', name: 'Samarqand Gidi - Jasur', avatar: null, email: 'guide@tripuz.uz' },
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { bookings: 2, availableDates: 1 },
    availableDates: [
      { id: 'date-mock-3', experienceId: 'exp-mock-2', date: new Date(Date.now() + 259200000), slots: 6 },
    ],
  },
];

// In-memory mock guide profile store (persists during server session)
export const mockGuideProfileStore: Record<string, any> = {};

/**
 * Get dashboard statistics for THIS guide only (Multi-tenancy isolated).
 */
export async function getGuideStats(guideId: string) {
  let dbExperiencesCount = 0;
  let dbBookings: any[] = [];

  try {
    dbExperiencesCount = await prisma.experience.count({
      where: { guideId },
    });

    dbBookings = await prisma.booking.findMany({
      where: {
        experience: { guideId },
      },
      select: { status: true, totalPrice: true },
    });
  } catch (error) {
    console.warn('Could not fetch stats from DB:', error);
  }

  // Filter in-memory mock stores strictly for THIS guideId
  const guideMockExps = mockExperiencesStore.filter((e) => e.guideId === guideId);
  const guideMockBookings = mockBookingsStore.filter(
    (b) => b.guideId === guideId || b.experience?.guideId === guideId
  );

  const totalExperiences = dbExperiencesCount + guideMockExps.length;
  const allBookings = [...dbBookings, ...guideMockBookings];
  const totalBookings = allBookings.length;
  const pendingBookings = allBookings.filter((b) => b.status === 'PENDING').length;

  const totalRevenueUsd = allBookings
    .filter((b) => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
    .reduce((sum, b) => sum + Number(b.totalPrice || 0), 0);

  return {
    totalExperiences,
    totalBookings,
    totalRevenueUsd,
    pendingBookings,
  };
}

/**
 * Get all experiences created by THIS guide only (Multi-tenancy isolated).
 */
export async function getGuideExperiences(guideId: string) {
  await ensureGuideUserExists(guideId);
  let dbList: any[] = [];
  try {
    dbList = await prisma.experience.findMany({
      where: { guideId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { bookings: true, availableDates: true },
        },
        availableDates: {
          where: { date: { gte: new Date() } },
          orderBy: { date: 'asc' },
        },
      },
    });
  } catch (error) {
    if (!env.isDev) throw error;
  }

  // Filter in-memory mock store strictly for THIS guideId
  const guideMockList = mockExperiencesStore.filter((exp) => exp.guideId === guideId);

  const dbIds = new Set(dbList.map((e) => e.id));
  const uniqueMockList = guideMockList.filter((exp) => !dbIds.has(exp.id));

  return [...dbList, ...uniqueMockList];
}

/**
 * Create a new experience / tour for THIS guide.
 */
export async function createGuideExperience(guideId: string, dto: CreateGuideExperienceDto) {
  await ensureGuideUserExists(guideId);
  const priceUsd = dto.priceUsd || dto.price || 0;
  if (priceUsd <= 0) {
    throw new HttpError(400, "Narx 0 dan katta bo'lishi kerak");
  }
  const priceUzs = dto.priceUzs ? dto.priceUzs : Math.round(priceUsd * USD_TO_UZS_RATE);
  const durationHours = dto.durationHours || 3;
  if (durationHours <= 0) {
    throw new HttpError(400, "Davomiyligi 0 dan katta bo'lishi shart");
  }
  const durationStr = `${durationHours} soat`;

  const title_uz = dto.title_uz || dto.title;
  const title_en = dto.title_en || title_uz || dto.title;
  const title_ru = dto.title_ru || title_uz || dto.title;

  const description_uz = dto.description_uz || dto.description;
  const description_en = dto.description_en || description_uz || dto.description;
  const description_ru = dto.description_ru || description_uz || dto.description;

  const meetingPointText_uz = dto.meetingPointText_uz || dto.meetingPointText || dto.meetingPoint;
  const meetingPointText_en = dto.meetingPointText_en || meetingPointText_uz || dto.meetingPointText || dto.meetingPoint;
  const meetingPointText_ru = dto.meetingPointText_ru || meetingPointText_uz || dto.meetingPointText || dto.meetingPoint;

  try {
    const created = await prisma.experience.create({
      data: {
        title: dto.title,
        title_uz,
        title_en,
        title_ru,
        description: dto.description,
        description_uz,
        description_en,
        description_ru,
        city: dto.city || 'Samarqand',
        price: priceUsd,
        priceUsd: priceUsd,
        priceUzs: priceUzs,
        duration: durationStr,
        durationHours: durationHours,
        meetingPoint: dto.meetingPoint,
        meetingPointText: dto.meetingPointText || dto.meetingPoint,
        meetingPointText_uz,
        meetingPointText_en,
        meetingPointText_ru,
        meetingPointMapUrl: dto.meetingPointMapUrl || null,
        languages: dto.languages || ["O'zbekcha"],
        images: dto.images || [],
        isActive: true,
        guideId: guideId,
      },
      include: {
        _count: { select: { bookings: true, availableDates: true } },
        availableDates: true,
      },
    });

    if (env.isDev) {
      mockExperiencesStore.unshift(created);
    }

    return created;
  } catch (error) {
    if (env.isDev) {
      console.warn('⚠️ Created mock experience in Dev Store for guideId:', guideId);

      const newMock = {
        id: `exp-mock-${Date.now()}`,
        title: dto.title,
        title_uz,
        title_en,
        title_ru,
        description: dto.description,
        description_uz,
        description_en,
        description_ru,
        city: dto.city || 'Samarqand',
        price: priceUsd,
        priceUsd,
        priceUzs: dto.priceUzs || Math.round(priceUsd * USD_TO_UZS_RATE),
        durationHours,
        duration: `${durationHours} soat`,
        meetingPoint: dto.meetingPoint,
        meetingPointText: dto.meetingPointText || dto.meetingPoint,
        meetingPointText_uz,
        meetingPointText_en,
        meetingPointText_ru,
        languages: dto.languages || ["O'zbekcha"],
        images: dto.images && dto.images.length > 0 ? dto.images : ['https://images.unsplash.com/photo-1590076215667-873d96c8913c?auto=format&fit=crop&w=800&q=80'],
        isActive: true,
        guideId,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { bookings: 0, availableDates: 0 },
        availableDates: [],
      };
      mockExperiencesStore.unshift(newMock);
      return newMock;
    }
    throw error;
  }
}

/**
 * Update an existing experience (Ownership checked).
 */
export async function updateGuideExperience(
  guideId: string,
  experienceId: string,
  dto: UpdateGuideExperienceDto,
) {
  try {
    const existing = await prisma.experience.findUnique({ where: { id: experienceId } });
    if (!existing) throw new HttpError(404, 'Ekskursiya topilmadi');
    if (existing.guideId !== guideId) {
      throw new HttpError(403, 'Siz faqat o`zingiz yaratgan turlarni tahrirlashingiz mumkin');
    }

    const priceUsd = dto.priceUsd !== undefined ? dto.priceUsd : Number(existing.priceUsd);
    const priceUzs = dto.priceUzs !== undefined ? dto.priceUzs : Math.round(priceUsd * USD_TO_UZS_RATE);
    const durationHours = dto.durationHours !== undefined ? dto.durationHours : existing.durationHours;

    const updated = await prisma.experience.update({
      where: { id: experienceId },
      data: {
        title: dto.title ?? existing.title,
        title_uz: dto.title_uz ?? (existing as any).title_uz ?? dto.title ?? existing.title,
        title_en: dto.title_en ?? (existing as any).title_en ?? dto.title_uz ?? (existing as any).title_uz ?? dto.title ?? existing.title,
        title_ru: dto.title_ru ?? (existing as any).title_ru ?? dto.title_uz ?? (existing as any).title_uz ?? dto.title ?? existing.title,
        description: dto.description ?? existing.description,
        description_uz: dto.description_uz ?? (existing as any).description_uz ?? dto.description ?? existing.description,
        description_en: dto.description_en ?? (existing as any).description_en ?? dto.description_uz ?? (existing as any).description_uz ?? dto.description ?? existing.description,
        description_ru: dto.description_ru ?? (existing as any).description_ru ?? dto.description_uz ?? (existing as any).description_uz ?? dto.description ?? existing.description,
        city: dto.city ?? existing.city,
        price: priceUsd,
        priceUsd: priceUsd,
        priceUzs: priceUzs,
        durationHours: durationHours,
        duration: `${durationHours} soat`,
        meetingPoint: dto.meetingPoint ?? existing.meetingPoint,
        meetingPointText: dto.meetingPointText ?? (dto.meetingPoint ?? (existing as any).meetingPointText ?? existing.meetingPoint),
        meetingPointText_uz: dto.meetingPointText_uz ?? (existing as any).meetingPointText_uz ?? dto.meetingPointText ?? existing.meetingPoint,
        meetingPointText_en: dto.meetingPointText_en ?? (existing as any).meetingPointText_en ?? dto.meetingPointText_uz ?? (existing as any).meetingPointText_uz ?? dto.meetingPointText ?? existing.meetingPoint,
        meetingPointText_ru: dto.meetingPointText_ru ?? (existing as any).meetingPointText_ru ?? dto.meetingPointText_uz ?? (existing as any).meetingPointText_uz ?? dto.meetingPointText ?? existing.meetingPoint,
        meetingPointMapUrl: dto.meetingPointMapUrl !== undefined ? dto.meetingPointMapUrl : (existing as any).meetingPointMapUrl,
        languages: dto.languages ? (dto.languages as any) : undefined,
        images: dto.images ? (dto.images as any) : undefined,
        isActive: dto.isActive !== undefined ? dto.isActive : existing.isActive,
      },
      include: {
        _count: { select: { bookings: true, availableDates: true } },
        availableDates: true,
      },
    });
    return updated;
  } catch (error) {
    if (env.isDev) {
      const idx = mockExperiencesStore.findIndex((e) => e.id === experienceId && e.guideId === guideId);
      if (idx !== -1) {
        const item = mockExperiencesStore[idx];
        if (dto.title) item.title = dto.title;
        if (dto.title_uz) item.title_uz = dto.title_uz;
        if (dto.title_en) item.title_en = dto.title_en;
        if (dto.title_ru) item.title_ru = dto.title_ru;
        if (dto.description) item.description = dto.description;
        if (dto.description_uz) item.description_uz = dto.description_uz;
        if (dto.description_en) item.description_en = dto.description_en;
        if (dto.description_ru) item.description_ru = dto.description_ru;
        if (dto.priceUsd) {
          item.priceUsd = dto.priceUsd;
          item.price = dto.priceUsd;
          item.priceUzs = Math.round(dto.priceUsd * USD_TO_UZS_RATE);
        }
        if (dto.durationHours) {
          item.durationHours = dto.durationHours;
          item.duration = `${dto.durationHours} soat`;
        }
        if (dto.meetingPoint) item.meetingPoint = dto.meetingPoint;
        if (dto.meetingPointText_uz) item.meetingPointText_uz = dto.meetingPointText_uz;
        if (dto.meetingPointText_en) item.meetingPointText_en = dto.meetingPointText_en;
        if (dto.meetingPointText_ru) item.meetingPointText_ru = dto.meetingPointText_ru;
        if (dto.meetingPointMapUrl !== undefined) item.meetingPointMapUrl = dto.meetingPointMapUrl;
        if (dto.images) item.images = dto.images;
        if (dto.languages) item.languages = dto.languages;
        if (dto.isActive !== undefined) item.isActive = dto.isActive;
        return item;
      }
    }
    throw error;
  }
}

/**
 * Toggle active/inactive state of an experience (Ownership checked).
 */
export async function toggleGuideExperienceStatus(guideId: string, experienceId: string) {
  try {
    const existing = await prisma.experience.findUnique({ where: { id: experienceId } });
    if (!existing) throw new HttpError(404, 'Ekskursiya topilmadi');
    if (existing.guideId !== guideId) throw new HttpError(403, 'Huquqingiz yetarli emas');

    return await prisma.experience.update({
      where: { id: experienceId },
      data: { isActive: !existing.isActive },
    });
  } catch (error) {
    if (env.isDev) {
      const exp = mockExperiencesStore.find((e) => e.id === experienceId && e.guideId === guideId);
      if (exp) {
        exp.isActive = !exp.isActive;
        return exp;
      }
    }
    throw error;
  }
}

/**
 * Delete an experience (Ownership checked).
 */
export async function deleteGuideExperience(guideId: string, experienceId: string) {
  try {
    const exp = await prisma.experience.findUnique({ where: { id: experienceId } });
    if (exp) {
      if (exp.guideId !== guideId) throw new HttpError(403, 'Huquqingiz yetarli emas');
      await prisma.experience.delete({ where: { id: experienceId } });
    }
    const idx = mockExperiencesStore.findIndex((e) => e.id === experienceId && e.guideId === guideId);
    if (idx !== -1) mockExperiencesStore.splice(idx, 1);
    return { success: true };
  } catch (error) {
    if (env.isDev) {
      const idx = mockExperiencesStore.findIndex((e) => e.id === experienceId && e.guideId === guideId);
      if (idx !== -1) mockExperiencesStore.splice(idx, 1);
      return { success: true };
    }
    throw error;
  }
}

/**
 * Add an available date/slot to an experience.
 */
export async function addGuideAvailableDate(guideId: string, experienceId: string, dto: AddAvailableDateDto) {
  try {
    const capacity = dto.maxCapacity || dto.slots || 10;
    const createdDate = await prisma.availableDate.create({
      data: {
        experienceId,
        date: dto.date,
        slots: capacity,
        maxCapacity: capacity,
        bookedCount: 0,
      },
    });
    return createdDate;
  } catch (error) {
    if (env.isDev) {
      const exp = mockExperiencesStore.find((e) => e.id === experienceId && e.guideId === guideId);
      const newSlot = {
        id: `date-mock-${Date.now()}`,
        experienceId,
        date: new Date(dto.date),
        slots: dto.slots || 10,
      };
      if (exp) {
        if (!exp.availableDates) exp.availableDates = [];
        exp.availableDates.push(newSlot);
        exp._count.availableDates = exp.availableDates.length;
      }
      return newSlot;
    }
    throw error;
  }
}

/**
 * Delete an available date/slot.
 */
export async function deleteGuideAvailableDate(guideId: string, dateId: string) {
  try {
    await prisma.availableDate.delete({ where: { id: dateId } });
    return { success: true };
  } catch (error) {
    if (env.isDev) {
      mockExperiencesStore.forEach((exp) => {
        if (exp.guideId === guideId && exp.availableDates) {
          const idx = exp.availableDates.findIndex((d: any) => d.id === dateId);
          if (idx !== -1) {
            exp.availableDates.splice(idx, 1);
            exp._count.availableDates = exp.availableDates.length;
          }
        }
      });
      return { success: true };
    }
    throw error;
  }
}

/**
 * Get all bookings for experiences belonging to THIS guide only (Multi-tenancy isolated).
 */
export async function getGuideBookings(guideId: string) {
  let dbBookings: any[] = [];
  try {
    dbBookings = await prisma.booking.findMany({
      where: {
        experience: { guideId },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true, phone: true } },
        experience: { select: { id: true, title: true, priceUsd: true, price: true } },
        availableDate: { select: { date: true } },
      },
    });
  } catch (error) {
    console.warn('Could not fetch guide bookings from DB:', error);
  }

  const guideMockBookings = mockBookingsStore.filter(
    (b) => b.guideId === guideId || b.experience?.guideId === guideId
  );

  const dbIds = new Set(dbBookings.map((b) => b.id));
  const uniqueMockBookings = guideMockBookings.filter((b) => !dbIds.has(b.id));

  return [...dbBookings, ...uniqueMockBookings];
}

/**
 * Update booking status for THIS guide's experience only.
 */
export async function updateGuideBookingStatus(
  guideId: string,
  bookingId: string,
  dto: UpdateBookingStatusDto,
) {
  // Check in-memory mock store first
  const mockBooking = mockBookingsStore.find(
    (b) => b.id === bookingId && (b.guideId === guideId || b.experience?.guideId === guideId)
  );
  if (mockBooking) {
    mockBooking.status = dto.status as BookingStatus;
    if (dto.status === 'CONFIRMED') {
      mockBooking.paymentStatus = PaymentStatus.PAID;
    }
    return mockBooking;
  }

  // Try DB booking update
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { experience: { select: { guideId: true } } },
    });

    if (booking) {
      if (booking.experience?.guideId !== guideId) {
        throw new HttpError(403, 'You can only update bookings for your own experiences');
      }

      if (dto.status === 'COMPLETED' && booking.status !== BookingStatus.CONFIRMED) {
        throw new HttpError(409, 'Can only mark a CONFIRMED booking as COMPLETED');
      }

      return await prisma.booking.update({
        where: { id: bookingId },
        data: { status: dto.status as BookingStatus },
        include: {
          user: { select: { name: true, email: true } },
          experience: { select: { title: true } },
        },
      });
    }
  } catch (err: any) {
    if (err instanceof HttpError) throw err;
    console.warn('Could not update booking status in DB:', err.message);
  }

  throw new HttpError(404, 'Booking not found');
}

/**
 * Get guide profile details for THIS guide only.
 */
export async function getGuideProfile(guideId: string) {
  await ensureGuideUserExists(guideId);
  try {
    let user = await prisma.user.findUnique({
      where: { id: guideId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        phone: true,
        telegramHandle: true,
        commissionRate: true,
        role: true,
      },
    }) as any;
    if (user) {
      const stored = mockGuideProfileStore[guideId];
      return {
        ...user,
        isCustomAvatarUploaded: stored?.isCustomAvatarUploaded ?? Boolean(user.isCustomAvatarUploaded),
      };
    }
  } catch (error) {
    if (!env.isDev) throw error;
  }

  const stored = mockGuideProfileStore[guideId];
  return {
    id: guideId,
    name: stored?.name || 'Gid Foydalanuvchi',
    email: stored?.email || `guide-${guideId.slice(0, 8)}@tripuz.uz`,
    avatar: stored?.avatar ?? null,
    isCustomAvatarUploaded: stored?.isCustomAvatarUploaded ?? false,
    phone: stored?.phone || '',
    telegramHandle: stored?.telegramHandle || '',
    commissionRate: 10,
    role: 'GUIDE',
  };
}

/**
 * Update guide profile details for THIS guide only.
 */
export async function updateGuideProfile(guideId: string, dto: UpdateGuideProfileDto) {
  await ensureGuideUserExists(guideId);
  const isSettingAvatar = dto.avatar !== undefined && Boolean(dto.avatar);
  try {
    const updatedUser = (await prisma.user.update({
      where: { id: guideId },
      data: {
        name: dto.name || undefined,
        phone: dto.phone !== undefined ? dto.phone : undefined,
        telegramHandle: dto.telegramHandle !== undefined ? dto.telegramHandle : undefined,
        avatar: dto.avatar !== undefined ? dto.avatar : undefined,
        ...(isSettingAvatar ? { isCustomAvatarUploaded: true } as any : {}),
        commissionRate: 10,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        phone: true,
        telegramHandle: true,
        commissionRate: true,
      },
    })) as any;

    updatedUser.isCustomAvatarUploaded = isSettingAvatar || Boolean(mockGuideProfileStore[guideId]?.isCustomAvatarUploaded);

    mockGuideProfileStore[guideId] = {
      ...(mockGuideProfileStore[guideId] || {}),
      name: updatedUser.name,
      avatar: updatedUser.avatar,
      isCustomAvatarUploaded: updatedUser.isCustomAvatarUploaded,
      phone: updatedUser.phone,
      telegramHandle: updatedUser.telegramHandle,
    };

    return updatedUser;
  } catch (error) {
    if (env.isDev) {
      const existing = mockGuideProfileStore[guideId] || {};
      const updated = {
        ...existing,
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.avatar !== undefined ? { avatar: dto.avatar, isCustomAvatarUploaded: true } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.telegramHandle !== undefined ? { telegramHandle: dto.telegramHandle } : {}),
      };
      mockGuideProfileStore[guideId] = updated;

      if (dto.avatar !== undefined) {
        mockExperiencesStore.forEach((exp) => {
          if (exp.guideId === guideId && exp.guide) {
            exp.guide.avatar = dto.avatar;
          }
        });
      }

      return {
        id: guideId,
        name: updated.name || 'Gid Foydalanuvchi',
        email: `guide-${guideId.slice(0, 8)}@tripuz.uz`,
        avatar: updated.avatar ?? null,
        isCustomAvatarUploaded: updated.isCustomAvatarUploaded ?? false,
        phone: updated.phone || '',
        telegramHandle: updated.telegramHandle || '',
        commissionRate: 10,
        role: 'GUIDE',
      };
    }
    throw error;
  }
}
