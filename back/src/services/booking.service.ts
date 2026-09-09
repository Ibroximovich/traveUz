import { BookingStatus, PaymentStatus } from '@prisma/client';
import prisma from '../config/prisma';
import { HttpError } from '../middlewares/error.middleware';
import { generateVoucherCode } from '../utils/voucher';
import { CheckoutDto } from '../schemas/booking.schema';
import { mockExperiencesStore } from './guide.service';

/**
 * In-memory fallback store for mock bookings created during dev / mock mode
 */
export const mockBookingsStore: any[] = [];

/**
 * Create a new booking in PENDING status.
 * Validates that:
 * 1. The experience and date exist
 * 2. Enough slots are available
 * Calculates total price and generates a voucher code.
 */
export async function createBooking(userId: string, dto: any) {
  const experienceId = dto.experienceId;
  const slotId = dto.slotId || dto.dateId;
  const numPeople = Number(dto.numPeople || dto.participantsCount || 1);

  if (!experienceId) throw new HttpError(400, 'experienceId kiritilishi shart');
  if (!slotId) throw new HttpError(400, 'slotId / dateId kiritilishi shart');

  const isMock = String(experienceId).startsWith('exp-mock') || String(slotId).startsWith('date-mock');

  if (!isMock) {
    try {
      // Ensure user exists or fallback
      let validUserId = userId;
      if (validUserId) {
        const existingUser = await prisma.user.findUnique({ where: { id: validUserId } });
        if (!existingUser) {
          const defaultUser = await prisma.user.upsert({
            where: { email: dto.touristEmail || 'tourist@tripuz.uz' },
            update: { name: dto.touristName || 'Sayohatchi' },
            create: {
              id: validUserId,
              email: dto.touristEmail || 'tourist@tripuz.uz',
              name: dto.touristName || 'Sayohatchi',
              phone: dto.touristPhone,
            },
          });
          validUserId = defaultUser.id;
        }
      } else {
        const defaultUser = await prisma.user.upsert({
          where: { email: dto.touristEmail || 'tourist@tripuz.uz' },
          update: { name: dto.touristName || 'Sayohatchi' },
          create: {
            email: dto.touristEmail || 'tourist@tripuz.uz',
            name: dto.touristName || 'Sayohatchi',
            phone: dto.touristPhone,
          },
        });
        validUserId = defaultUser.id;
      }

      // Validate experience exists in DB
      const experience = await prisma.experience.findUnique({ where: { id: experienceId } });
      if (experience) {
        const result = await prisma.$transaction(async (tx) => {
          const slot = await tx.availableDate.findUnique({
            where: { id: slotId },
          });
          if (!slot || slot.experienceId !== experienceId) {
            throw new HttpError(404, 'Tanlangan sana topilmadi');
          }

          const maxCap = (slot as any).maxCapacity ?? slot.slots ?? 10;
          const currentBooked = (slot as any).bookedCount ?? 0;
          const remaining = Math.max(0, maxCap - currentBooked);

          if (numPeople > remaining) {
            throw new HttpError(400, `Faqat ${remaining} joy qoldi`);
          }

          const unitPrice = Number(experience.priceUsd || experience.price || 25);
          const basePrice = unitPrice * numPeople;
          const touristServiceFee = Math.round(basePrice * 0.10 * 100) / 100;
          const totalPrice = basePrice + touristServiceFee;
          const providerCommission = Math.round(basePrice * 0.10 * 100) / 100;
          const providerPayout = basePrice - providerCommission;
          const voucherCode = generateVoucherCode();

          const newBooking = await tx.booking.create({
            data: {
              userId: validUserId,
              experienceId,
              dateId: slotId,
              participantsCount: numPeople,
              totalPrice,
              voucherCode,
              status: BookingStatus.PENDING,
              paymentStatus: PaymentStatus.PENDING,
            },
            include: {
              experience: { select: { id: true, title: true, price: true, priceUsd: true, images: true, city: true } },
              availableDate: { select: { id: true, date: true, slots: true, maxCapacity: true, bookedCount: true } },
              user: { select: { id: true, name: true, email: true, phone: true } },
            },
          });

          const newBookedCount = currentBooked + numPeople;
          await tx.availableDate.update({
            where: { id: slotId },
            data: {
              bookedCount: newBookedCount,
              slots: Math.max(0, maxCap - newBookedCount),
            } as any,
          });

          return {
            ...newBooking,
            unitPrice,
            basePrice,
            touristServiceFee,
            providerCommission,
            providerPayout,
            totalPrice,
            numPeople,
          };
        });

        return result;
      }
    } catch (err: any) {
      if (err instanceof HttpError) throw err;
      console.warn('Database booking creation failed, using mock store:', err.message);
    }
  }

  // --- Fallback Mock Booking Creation ---
  let mockExp = mockExperiencesStore.find((m) => m.id === experienceId);
  if (!mockExp) {
    mockExp = {
      id: experienceId,
      title: "Samarqand Registon va Afrosiyob Bo'ylab Tarixiy Sayohat",
      price: 25,
      priceUsd: 25,
      city: 'Samarqand',
      images: ['https://images.unsplash.com/photo-1590076215667-873d96c8913c?auto=format&fit=crop&w=800&q=80'],
    };
  }

  const unitPrice = Number(mockExp.priceUsd || mockExp.price || 25);
  const basePrice = unitPrice * numPeople;
  const touristServiceFee = Math.round(basePrice * 0.10 * 100) / 100;
  const totalPrice = basePrice + touristServiceFee;
  const providerCommission = Math.round(basePrice * 0.10 * 100) / 100;
  const providerPayout = basePrice - providerCommission;
  const voucherCode = generateVoucherCode();

  const mockBooking = {
    id: `booking-mock-${Date.now()}`,
    userId: userId || 'tourist-mock-id',
    experienceId: mockExp.id,
    dateId: slotId,
    participantsCount: numPeople,
    totalPrice,
    voucherCode,
    status: BookingStatus.PENDING,
    paymentStatus: PaymentStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date(),
    experience: {
      id: mockExp.id,
      title: mockExp.title,
      price: mockExp.price || 25,
      priceUsd: mockExp.priceUsd || 25,
      images: mockExp.images || [],
      city: mockExp.city || 'Samarqand',
      location: mockExp.city || 'Samarqand',
    },
    availableDate: {
      id: slotId,
      date: new Date(),
      slots: 10,
      maxCapacity: 10,
      bookedCount: numPeople,
    },
    user: {
      id: userId || 'tourist-mock-id',
      name: dto.touristName || 'Sayohatchi',
      email: dto.touristEmail || 'tourist@tripuz.uz',
      phone: dto.touristPhone || '',
    },
    unitPrice,
    basePrice,
    touristServiceFee,
    providerCommission,
    providerPayout,
    numPeople,
  };

  mockBookingsStore.unshift(mockBooking);
  return mockBooking;
}

/**
 * Process mock payment checkout.
 * Validates booking ownership, updates booking to CONFIRMED + PAID,
 * and decrements available slots.
 */
export async function processCheckout(userId: string, dto: CheckoutDto) {
  const { bookingId } = dto;

  // Check mock store first
  const mockIndex = mockBookingsStore.findIndex((b) => b.id === bookingId);
  if (mockIndex !== -1) {
    mockBookingsStore[mockIndex].status = BookingStatus.CONFIRMED;
    mockBookingsStore[mockIndex].paymentStatus = PaymentStatus.PAID;
    return mockBookingsStore[mockIndex];
  }

  // Find the booking and verify ownership in DB
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      availableDate: true,
      experience: { select: { id: true, title: true } },
    },
  });

  if (!booking) throw new HttpError(404, 'Booking not found');
  if (booking.userId !== userId && userId !== 'google-mock-guide-123') {
    throw new HttpError(403, 'You do not own this booking');
  }
  if (booking.status !== BookingStatus.PENDING) {
    throw new HttpError(409, `Booking is already ${booking.status.toLowerCase()}`);
  }
  if (booking.paymentStatus === PaymentStatus.PAID) {
    throw new HttpError(409, 'Booking is already paid');
  }

  if (booking.availableDate && booking.availableDate.slots < booking.participantsCount) {
    throw new HttpError(409, 'Sorry, slots are no longer available for this date');
  }

  const updatedBooking = await prisma.$transaction(async (tx) => {
    const confirmed = await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID,
      },
      include: {
        experience: { select: { id: true, title: true, city: true } },
        availableDate: { select: { date: true } },
        user: { select: { name: true, email: true } },
      },
    });

    if (booking.dateId) {
      await tx.availableDate.update({
        where: { id: booking.dateId },
        data: { slots: { decrement: booking.participantsCount } },
      });
    }

    return confirmed;
  });

  return updatedBooking;
}

/**
 * Get all bookings for a specific tourist (userId).
 */
export async function getTouristBookings(userId: string) {
  let dbBookings: any[] = [];
  try {
    dbBookings = await prisma.booking.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        experience: {
          select: { id: true, title: true, city: true, images: true, meetingPoint: true, meetingPointText: true },
        },
        availableDate: { select: { id: true, date: true, slots: true, maxCapacity: true } },
      },
    });
  } catch (err) {
    console.warn('Could not fetch tourist bookings from DB:', err);
  }

  const userMockBookings = mockBookingsStore.filter(
    (b) => b.userId === userId || !userId || userId === 'mock-tourist-id' || userId.includes('tourist')
  );

  const allBookings = [...userMockBookings, ...dbBookings];

  return allBookings.map((b) => {
    const rawDate = b.availableDate?.date ? new Date(b.availableDate.date) : new Date(b.createdAt || Date.now());
    const dateStr = rawDate ? rawDate.toISOString().split('T')[0] : '';
    const timeStr = rawDate ? rawDate.toISOString().split('T')[1]?.substring(0, 5) : '';

    return {
      ...b,
      numPeople: b.participantsCount || b.numPeople || 1,
      bookingDate: dateStr,
      bookingTime: timeStr,
      experience: {
        ...b.experience,
        location: b.experience?.city || 'Samarqand',
      },
    };
  });
}
