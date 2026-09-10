import { Experience, AvailableDate } from '@prisma/client';
import prisma from '../config/prisma';
import { HttpError } from '../middlewares/error.middleware';
import { ExperienceQueryDto, CreateExperienceDto } from '../schemas/experience.schema';
import { SupportedLanguage, getLocalizedText, getLocalizedField } from '../utils/i18n';
import { mockExperiencesStore } from './guide.service';

type ExperienceWithDates = Experience & { availableDates: AvailableDate[] };

/**
 * Transforms JSON or string fields into the target requested language.
 */
export function localizeExperience<T extends Partial<Experience>>(exp: T, lang: SupportedLanguage = 'uz'): T & { location: string; maxGroupSize: number; meetingPointText: string } {
  if (!exp) return exp as any;
  const cityText = getLocalizedText(exp.city, lang) || 'Samarqand';
  const meetingPointText = getLocalizedField(exp, 'meetingPointText', lang) || getLocalizedText(exp.meetingPoint, lang) || 'Registon maydoni';
  const titleText = getLocalizedField(exp, 'title', lang) || getLocalizedText(exp.title, lang);
  const descriptionText = getLocalizedField(exp, 'description', lang) || getLocalizedText(exp.description, lang);

  // Filter availableDates to only future dates
  let futureDates = (exp as any).availableDates;
  if (Array.isArray(futureDates)) {
    const now = new Date();
    futureDates = futureDates.filter((d: any) => new Date(d.date) >= now);
  }

  return {
    ...exp,
    location: cityText,
    maxGroupSize: (exp as any).maxGroupSize || 10,
    meetingPointText,
    title: titleText,
    description: descriptionText,
    city: cityText,
    meetingPoint: meetingPointText,
    availableDates: futureDates,
  };
}

/**
 * Get paginated list of active experiences filtered by city and sorted by price.
 */
export async function getExperiences(query: ExperienceQueryDto, lang: SupportedLanguage = 'uz') {
  const { city, sort, page = 1, limit = 50 } = query;
  const skip = (page - 1) * limit;
  const now = new Date();

  const where: any = {
    isActive: true,
    availableDates: {
      some: {
        date: { gte: now },
        slots: { gt: 0 },
      },
    },
  };
  if (city && city !== 'ALL') {
    where.city = { contains: city, mode: 'insensitive' };
  }

  let orderBy: any = { createdAt: 'desc' };
  if (sort === 'price_asc' || sort === 'price-asc' || sort === 'asc') {
    orderBy = { priceUsd: 'asc' };
  } else if (sort === 'price_desc' || sort === 'price-desc' || sort === 'desc') {
    orderBy = { priceUsd: 'desc' };
  }

  let dbExperiences: any[] = [];
  try {
    dbExperiences = await prisma.experience.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        guide: {
          select: { id: true, name: true, avatar: true },
        },
        _count: {
          select: { bookings: true, availableDates: true },
        },
        availableDates: {
          where: {
            date: { gte: now },
            slots: { gt: 0 },
          },
          orderBy: { date: 'asc' },
        },
      },
    });
  } catch (err) {
    console.warn('Prisma findMany failed, using mock store:', err);
  }

  let combined: any[] = [...dbExperiences];

  // Merge in-memory active mock experiences if not already in DB list
  const mockFiltered = mockExperiencesStore.filter((m) => {
    if (!m.isActive) return false;
    if (city && city !== 'ALL') {
      const matchCity = m.city.toLowerCase().includes(city.toLowerCase()) || city.toLowerCase().includes(m.city.toLowerCase());
      if (!matchCity) return false;
    }
    return !combined.some((dbExp) => dbExp.id === m.id);
  });

  combined = [...combined, ...mockFiltered];

  // STRICT REQUIREMENT: Only keep experiences that have at least 1 future available date slot
  combined = combined.filter((exp) => {
    if (!exp.availableDates || !Array.isArray(exp.availableDates) || exp.availableDates.length === 0) {
      return false;
    }
    const validFutureSlots = exp.availableDates.filter((d: any) => {
      const isFuture = new Date(d.date) >= now;
      const hasSlots = d.slots === undefined || Number(d.slots) > 0;
      return isFuture && hasSlots;
    });
    return validFutureSlots.length > 0;
  });

  if (sort === 'price_asc' || sort === 'price-asc' || sort === 'asc') {
    combined.sort((a, b) => Number(a.priceUsd || a.price) - Number(b.priceUsd || b.price));
  } else if (sort === 'price_desc' || sort === 'price-desc' || sort === 'desc') {
    combined.sort((a, b) => Number(b.priceUsd || b.price) - Number(a.priceUsd || a.price));
  }

  const localizedExperiences = combined.map((exp) => localizeExperience(exp, lang));

  return {
    experiences: localizedExperiences,
    meta: {
      page,
      limit,
      total: combined.length,
      totalPages: Math.ceil(combined.length / limit),
    },
  };
}

/**
 * Get a single experience by ID with full details and available dates.
 */
export async function getExperienceById(id: string, lang: SupportedLanguage = 'uz'): Promise<ExperienceWithDates> {
  let experience = await prisma.experience.findUnique({
    where: { id },
    include: {
      guide: {
        select: { id: true, name: true, avatar: true, email: true },
      },
      availableDates: {
        where: {
          date: { gte: new Date() },
        },
        orderBy: { date: 'asc' },
      },
    },
  }).catch(() => null);

  if (!experience) {
    experience = mockExperiencesStore.find((m) => m.id === id);
  }

  if (!experience || !experience.isActive) throw new HttpError(404, 'Experience not found or inactive');
  return localizeExperience(experience, lang) as ExperienceWithDates;
}

/**
 * Create a new experience (admin/guide use).
 */
export async function createExperience(data: CreateExperienceDto) {
  const { availableDates, ...experienceData } = data;
  const priceUsd = data.priceUsd || data.price || 0;
  const durationHours = data.durationHours || 3;

  const experience = await prisma.experience.create({
    data: {
      title: data.title,
      description: data.description,
      city: data.city || 'Samarqand',
      price: priceUsd,
      priceUsd: priceUsd,
      priceUzs: data.priceUzs || Math.round(priceUsd * 12800),
      durationHours: durationHours,
      duration: `${durationHours} soat`,
      meetingPoint: data.meetingPoint,
      guideId: data.guideId || 'admin-id',
      images: (data.images || []) as any,
      languages: (data.languages || ["O'zbekcha"]) as any,
      isActive: true,
      availableDates: availableDates
        ? {
            create: availableDates.map((d: { date: Date; slots?: number; maxCapacity?: number }) => ({
              date: d.date,
              slots: d.slots || d.maxCapacity || 10,
              maxCapacity: d.maxCapacity || d.slots || 10,
              bookedCount: 0,
            })),
          }
        : undefined,
    },
    include: {
      availableDates: true,
      guide: { select: { id: true, name: true, avatar: true } },
    },
  });

  return experience;
}
