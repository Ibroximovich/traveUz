import { BookingStatus, PaymentStatus } from '@prisma/client';
import prisma from '../config/prisma';
import { env } from '../config/env';
import { CommissionReport } from '../types';
import { CreateExperienceDto } from '../schemas/experience.schema';
import { createExperience as createExpService } from './experience.service';

/**
 * Get all bookings (admin view) with optional status filter.
 */
export async function getAllBookings(statusFilter?: string) {
  const whereClause =
    statusFilter && Object.values(BookingStatus).includes(statusFilter as BookingStatus)
      ? { status: statusFilter as BookingStatus }
      : {};

  return prisma.booking.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, email: true } },
      experience: { select: { id: true, title: true, city: true, guideId: true } },
      availableDate: { select: { date: true } },
    },
  });
}

/**
 * Calculate platform commission report per guide.
 * Groups PAID bookings by guide and computes revenue and commission.
 */
export async function getCommissionReport(): Promise<CommissionReport[]> {
  const commissionRate = env.commissionRate;

  // Get all experiences with guides and their paid bookings
  const guides = await prisma.user.findMany({
    where: { role: 'GUIDE' },
    select: {
      id: true,
      name: true,
      email: true,
      experiences: {
        select: {
          bookings: {
            where: { paymentStatus: PaymentStatus.PAID },
            select: { totalPrice: true, participantsCount: true },
          },
        },
      },
    },
  });

  const report: CommissionReport[] = guides.map((guide) => {
    const allBookings = guide.experiences.flatMap((exp) => exp.bookings);
    const totalRevenue = allBookings.reduce((sum, b) => sum + Number(b.totalPrice), 0);
    const platformCommission = totalRevenue * commissionRate;
    const netPayout = totalRevenue - platformCommission;

    return {
      guideId: guide.id,
      guideName: guide.name,
      guideEmail: guide.email,
      totalBookings: allBookings.length,
      totalRevenue,
      platformCommission: parseFloat(platformCommission.toFixed(2)),
      netPayout: parseFloat(netPayout.toFixed(2)),
    };
  });

  return report.sort((a, b) => b.totalRevenue - a.totalRevenue);
}

/**
 * Create experience (admin wraps the experience service).
 */
export async function adminCreateExperience(data: CreateExperienceDto) {
  return createExpService(data);
}

/**
 * Get platform-wide stats (total revenue, bookings, users, etc.)
 */
export async function getPlatformStats() {
  const [totalUsers, totalExperiences, totalBookings, revenueResult] = await Promise.all([
    prisma.user.count(),
    prisma.experience.count(),
    prisma.booking.count(),
    prisma.booking.aggregate({
      where: { paymentStatus: PaymentStatus.PAID },
      _sum: { totalPrice: true },
    }),
  ]);

  const totalRevenue = Number(revenueResult._sum.totalPrice ?? 0);

  return {
    totalUsers,
    totalExperiences,
    totalBookings,
    totalRevenue,
    platformCommission: parseFloat((totalRevenue * env.commissionRate).toFixed(2)),
    commissionRate: env.commissionRate,
  };
}
