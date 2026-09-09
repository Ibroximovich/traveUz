import { z } from 'zod';

/**
 * Schema for GET /api/experiences (query params)
 */
export const experienceQuerySchema = z.object({
  city: z.string().optional(),
  sort: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
});

/**
 * Schema for Guide / Admin POST /api/guide/experiences (create new experience)
 */
export const createGuideExperienceSchema = z.object({
  title: z.string({ required_error: "Sarlavha kiritilishi shart" }).min(3, "Sarlavha kamida 3 ta belgidan iborat bo'lishi kerak").max(200),
  title_uz: z.string().optional(),
  title_en: z.string().optional(),
  title_ru: z.string().optional(),
  description: z.string({ required_error: "Tavsif kiritilishi shart" }).min(3, "Tavsif kamida 3 ta belgidan iborat bo'lishi kerak"),
  description_uz: z.string().optional(),
  description_en: z.string().optional(),
  description_ru: z.string().optional(),
  city: z.string().min(2).default('Samarqand'),
  priceUsd: z.coerce.number().positive("Narx 0 dan katta bo'lishi kerak").optional(),
  priceUzs: z.coerce.number().optional(),
  price: z.coerce.number().optional(),
  durationHours: z.coerce.number({ required_error: "Davomiyligi kiritilishi shart" }).positive("Davomiyligi 0 dan katta bo'lishi shart"),
  duration: z.string().optional(),
  meetingPoint: z.string({ required_error: "Uchrashuv joyi kiritilishi shart" }).min(2, "Uchrashuv joyi kamida 2 ta belgi bo'lishi kerak"),
  meetingPointText: z.string().optional(),
  meetingPointText_uz: z.string().optional(),
  meetingPointText_en: z.string().optional(),
  meetingPointText_ru: z.string().optional(),
  meetingPointMapUrl: z.string().url("Xarita havolasi to'g'ri URL bo'lishi kerak (masalan: https://maps.google.com/...)").or(z.literal('')).nullable().optional(),
  languages: z.array(z.string()).min(1, "Kamida 1 ta til tanlanishi shart").default(["O'zbekcha"]),
  images: z.array(z.string()).min(1, "Kamida 1 ta rasm yuklanishi shart").max(5, "Ko'pi bilan 5 ta rasm yuklash mumkin"),
  guideId: z.string().optional(),
  availableDates: z
    .array(
      z.object({
        date: z.coerce.date(),
        slots: z.number().int().positive().max(100).optional(),
        maxCapacity: z.number().int().positive().max(100).optional(),
      }),
    )
    .optional(),
});

export const createExperienceSchema = createGuideExperienceSchema;

/**
 * Schema for Guide PUT /api/guide/experiences/:id (update existing experience)
 */
export const updateGuideExperienceSchema = createGuideExperienceSchema.partial().extend({
  isActive: z.boolean().optional(),
});

/**
 * Schema for Guide POST /api/guide/experiences/:id/dates (add available date/slot)
 */
export const addAvailableDateSchema = z.object({
  date: z.coerce.date({ required_error: 'Sana kiritilishi shart' }),
  slots: z.coerce.number().int().positive().optional().default(10),
  maxCapacity: z.coerce.number().int().positive().optional().default(10),
});

/**
 * Schema for Guide Profile Update (PUT /api/guide/profile)
 */
export const updateGuideProfileSchema = z.object({
  name: z.string().min(2, "Ism kamida 2 ta belgi bo'lishi kerak").optional().or(z.literal('')),
  phone: z.string().nullable().optional().or(z.literal('')),
  telegramHandle: z.string().nullable().optional().or(z.literal('')),
  avatar: z.string().nullable().optional().or(z.literal('')),
});

export type ExperienceQueryDto = z.infer<typeof experienceQuerySchema>;
export type CreateGuideExperienceDto = z.infer<typeof createGuideExperienceSchema>;
export type UpdateGuideExperienceDto = z.infer<typeof updateGuideExperienceSchema>;
export type CreateExperienceDto = CreateGuideExperienceDto;
export type AddAvailableDateDto = z.infer<typeof addAvailableDateSchema>;
export type UpdateGuideProfileDto = z.infer<typeof updateGuideProfileSchema>;
