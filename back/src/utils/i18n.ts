export type SupportedLanguage = 'uz' | 'ru' | 'en';

export interface LocalizedString {
  uz: string;
  ru?: string;
  en?: string;
  [key: string]: string | undefined;
}

/**
 * Parses and returns localized text based on requested language.
 * Falls back to 'uz' -> 'en' -> 'ru' if target language is missing.
 */
export function getLocalizedText(
  value: string | LocalizedString | null | undefined,
  lang: SupportedLanguage = 'uz'
): string {
  if (!value) return '';

  // If already an object
  if (typeof value === 'object') {
    return value[lang] || value['uz'] || value['en'] || value['ru'] || '';
  }

  // If string, check if it's JSON encoded
  if (typeof value === 'string') {
    if (value.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(value) as LocalizedString;
        return parsed[lang] || parsed['uz'] || parsed['en'] || parsed['ru'] || value;
      } catch {
        return value;
      }
    }
    return value;
  }

  return String(value);
}

/**
 * Gets a localized property (title, description, meetingPointText) from an experience object.
 * Tries `[field]_[lang]`, then `[field]_uz`, then `[field]`, then `[field]_en`, `[field]_ru`.
 */
export function getLocalizedField(
  item: any,
  fieldName: 'title' | 'description' | 'meetingPointText',
  lang: SupportedLanguage = 'uz'
): string {
  if (!item) return '';

  const targetVal = item[`${fieldName}_${lang}`];
  if (targetVal && typeof targetVal === 'string' && targetVal.trim().length > 0) {
    return targetVal;
  }

  const uzVal = item[`${fieldName}_uz`];
  if (uzVal && typeof uzVal === 'string' && uzVal.trim().length > 0) {
    return uzVal;
  }

  const defaultVal = item[fieldName];
  if (defaultVal) {
    const loc = getLocalizedText(defaultVal, lang);
    if (loc && loc.trim().length > 0) return loc;
  }

  const enVal = item[`${fieldName}_en`];
  if (enVal && typeof enVal === 'string' && enVal.trim().length > 0) {
    return enVal;
  }

  const ruVal = item[`${fieldName}_ru`];
  if (ruVal && typeof ruVal === 'string' && ruVal.trim().length > 0) {
    return ruVal;
  }

  return '';
}

export const localizedErrors: Record<string, Record<SupportedLanguage, string>> = {
  unauthorized: {
    uz: 'Avtorizatsiyadan oʻtilmagan. Iltimos, hisobingizga kiring.',
    en: 'Authentication required. Please log in.',
    ru: 'Требуется авторизация. Пожалуйста, войдите в систему.',
  },
  invalidToken: {
    uz: "Yaroqsiz yoki muddati o'tgan token. Qayta kiring.",
    en: 'Invalid or expired token. Please log in again.',
    ru: 'Недействительный или истекший токен. Войдите снова.',
  },
  forbidden: {
    uz: 'Ruxsat berilmadi. Huquqingiz yetarli emas.',
    en: 'Access denied. Insufficient permissions.',
    ru: 'Доступ запрещен. Недостаточно прав.',
  },
  notFound: {
    uz: 'Manba topilmadi.',
    en: 'Resource not found.',
    ru: 'Ресурс не найден.',
  },
  experienceNotFound: {
    uz: 'Ekskursiya topilmadi yoki faol emas.',
    en: 'Experience not found or inactive.',
    ru: 'Экскурсия не найдена или неактивна.',
  },
  bookingNotFound: {
    uz: 'Bron topilmadi.',
    en: 'Booking not found.',
    ru: 'Бронирование не найдено.',
  },
  userNotFound: {
    uz: 'Foydalanuvchi topilmadi.',
    en: 'User not found.',
    ru: 'Пользователь не найден.',
  },
  atLeastOneImage: {
    uz: 'Kamida 1 ta rasm yuklanishi kerak.',
    en: 'At least 1 image is required.',
    ru: 'Требуется хотя бы 1 изображение.',
  },
  slotsNotAvailable: {
    uz: 'Afsuski, ushbu sana uchun joylar qolmagan.',
    en: 'Sorry, slots are no longer available for this date.',
    ru: 'К сожалению, места на эту дату закончились.',
  },
  invalidImageFile: {
    uz: 'Faqat rasm fayllari (JPG, PNG, WEBP, GIF) yuklash mumkin.',
    en: 'Only image files (JPG, PNG, WEBP, GIF) are allowed.',
    ru: 'Разрешены только файлы изображений (JPG, PNG, WEBP, GIF).',
  },
  priceInvalid: {
    uz: "Narx 0 dan katta bo'lishi kerak.",
    en: 'Price must be greater than 0.',
    ru: 'Цена должна быть больше 0.',
  },
  durationInvalid: {
    uz: "Davomiyligi 0 dan katta bo'lishi shart.",
    en: 'Duration must be greater than 0.',
    ru: 'Продолжительность должна быть больше 0.',
  },
  validationError: {
    uz: "Validatsiya xatosi. Ma'lumotlar noto'g'ri formatda.",
    en: 'Validation error. Invalid request data.',
    ru: 'Ошибка валидации. Некорректные данные.',
  },
  internalError: {
    uz: 'Serverda ichki xatolik yuz berdi.',
    en: 'Internal server error.',
    ru: 'Внутренняя ошибка сервера.',
  },
};

export function getLocalizedError(key: string, lang: SupportedLanguage = 'uz'): string {
  if (localizedErrors[key]) {
    return localizedErrors[key][lang] || localizedErrors[key]['uz'];
  }
  return key;
}

