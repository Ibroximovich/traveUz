import { Request, Response, NextFunction } from 'express';
import * as adminService from '../services/admin.service';
import { CreateExperienceDto } from '../schemas/experience.schema';

/**
 * POST /api/admin/experiences
 * Create a new experience (admin only).
 */
export async function createExperience(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = req.body as CreateExperienceDto;
    const experience = await adminService.adminCreateExperience(dto);

    res.status(201).json({
      success: true,
      message: 'Experience created successfully',
      data: experience,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/bookings
 * Get all bookings with optional status filter.
 */
export async function getAllBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status } = req.query as { status?: string };
    const bookings = await adminService.getAllBookings(status);

    res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/commissions
 * Get commission report per guide.
 */
export async function getCommissions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const [report, stats] = await Promise.all([
      adminService.getCommissionReport(),
      adminService.getPlatformStats(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        platformStats: stats,
        commissionByGuide: report,
      },
    });
  } catch (error) {
    next(error);
  }
}
