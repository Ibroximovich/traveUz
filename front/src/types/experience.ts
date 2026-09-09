export interface AvailableDate {
  id: string;
  experienceId: string;
  date: string;
  slots: number;
  maxCapacity?: number;
  bookedCount?: number;
  createdAt?: string;
}

export interface Experience {
  id: string;
  title: string;
  title_uz?: string;
  title_en?: string;
  title_ru?: string;
  description: string;
  description_uz?: string;
  description_en?: string;
  description_ru?: string;
  location?: string;
  city: string;
  price: number;
  priceUsd: number;
  priceUzs?: number;
  duration: string;
  durationHours: number;
  meetingPoint: string;
  meetingPointText?: string;
  meetingPointText_uz?: string;
  meetingPointText_en?: string;
  meetingPointText_ru?: string;
  meetingPointMapUrl?: string;
  maxGroupSize?: number;
  languages: string[];
  images: string[];
  isActive: boolean;
  guideId: string;
  createdAt: string;
  updatedAt?: string;
  _count?: {
    bookings: number;
    availableDates: number;
  };
  availableDates?: AvailableDate[];
}

export function getExpTitle(exp: Partial<Experience> | undefined | null, lang: string = 'uz'): string {
  if (!exp) return '';
  if (lang === 'en' && exp.title_en) return exp.title_en;
  if (lang === 'ru' && exp.title_ru) return exp.title_ru;
  if (lang === 'uz' && exp.title_uz) return exp.title_uz;
  return exp.title_uz || exp.title || exp.title_en || exp.title_ru || '';
}

export function getExpDescription(exp: Partial<Experience> | undefined | null, lang: string = 'uz'): string {
  if (!exp) return '';
  if (lang === 'en' && exp.description_en) return exp.description_en;
  if (lang === 'ru' && exp.description_ru) return exp.description_ru;
  if (lang === 'uz' && exp.description_uz) return exp.description_uz;
  return exp.description_uz || exp.description || exp.description_en || exp.description_ru || '';
}

export function getExpMeetingPoint(exp: Partial<Experience> | undefined | null, lang: string = 'uz'): string {
  if (!exp) return '';
  if (lang === 'en' && exp.meetingPointText_en) return exp.meetingPointText_en;
  if (lang === 'ru' && exp.meetingPointText_ru) return exp.meetingPointText_ru;
  if (lang === 'uz' && exp.meetingPointText_uz) return exp.meetingPointText_uz;
  return exp.meetingPointText_uz || exp.meetingPointText || exp.meetingPoint || '';
}

export interface CreateExperienceDto {
  title: string;
  description: string;
  city?: string;
  priceUsd: number;
  priceUzs?: number;
  price?: number;
  durationHours: number;
  duration?: string;
  meetingPoint: string;
  meetingPointText?: string;
  meetingPointMapUrl?: string;
  languages?: string[];
  images?: string[];
}

export interface UpdateExperienceDto extends Partial<CreateExperienceDto> {
  isActive?: boolean;
}

export interface AddAvailableDateDto {
  date: string;
  slots?: number;
  maxCapacity?: number;
}

export interface Booking {
  id: string;
  userId: string;
  experienceId: string;
  dateId: string;
  participantsCount: number;
  numPeople?: number;
  bookingDate?: string;
  bookingTime?: string;
  totalPrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED' | 'UNPAID';
  voucherCode: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    phone?: string;
  };
  experience?: {
    id: string;
    title: string;
    priceUsd?: number;
    price?: number;
    city?: string;
    location?: string;
    images?: string[];
  };
  availableDate?: {
    id?: string;
    date: string;
  };
}

export interface GuideStats {
  totalExperiences: number;
  totalBookings: number;
  totalRevenueUsd: number;
  pendingBookings: number;
}

export interface GuideProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  avatarUrl?: string; // alias for avatar, used interchangeably
  isCustomAvatarUploaded?: boolean;
  phone?: string;
  telegramHandle?: string;
  commissionRate: number;
  role: string;
}
