import { Response, NextFunction } from 'express';
import * as guideService from '../services/guide.service';
import { AuthRequest } from '../types';
import { UpdateBookingStatusDto } from '../schemas/booking.schema';
import {
  CreateGuideExperienceDto,
  UpdateGuideExperienceDto,
  AddAvailableDateDto,
  UpdateGuideProfileDto,
} from '../schemas/experience.schema';

/**
 * GET /api/guide/stats
 * Get guide dashboard statistics.
 */
export async function getStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const guideId = req.user!.sub;
    const stats = await guideService.getGuideStats(guideId);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/guide/experiences
 * Get all experiences created by the authenticated guide.
 */
export async function getMyExperiences(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const guideId = req.user!.sub;
    const experiences = await guideService.getGuideExperiences(guideId);

    res.status(200).json({
      success: true,
      data: experiences,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/guide/experiences
 * Create a new experience / tour.
 */
export async function createExperience(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const guideId = req.user!.sub;
    const dto = req.body as CreateGuideExperienceDto;
    const experience = await guideService.createGuideExperience(guideId, dto);

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
 * PUT /api/guide/experiences/:id
 * Update an existing experience.
 */
export async function updateExperience(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const guideId = req.user!.sub;
    const { id } = req.params;
    const dto = req.body as UpdateGuideExperienceDto;
    const experience = await guideService.updateGuideExperience(guideId, id, dto);

    res.status(200).json({
      success: true,
      message: 'Experience updated successfully',
      data: experience,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/guide/experiences/:id/status
 * Toggle active/inactive state of an experience.
 */
export async function toggleExperienceStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const guideId = req.user!.sub;
    const { id } = req.params;
    const experience = await guideService.toggleGuideExperienceStatus(guideId, id);

    res.status(200).json({
      success: true,
      message: 'Experience status toggled',
      data: experience,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/guide/experiences/:id
 * Delete an experience.
 */
export async function deleteExperience(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const guideId = req.user!.sub;
    const { id } = req.params;
    await guideService.deleteGuideExperience(guideId, id);

    res.status(200).json({
      success: true,
      message: 'Experience deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/guide/upload
 * Upload images for experience/tour.
 */
export async function uploadImages(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    let rawFiles: Express.Multer.File[] = [];
    if (Array.isArray(req.files)) {
      rawFiles = req.files;
    } else if (req.files && typeof req.files === 'object') {
      rawFiles = Object.values(req.files).flat();
    } else if (req.file) {
      rawFiles = [req.file as Express.Multer.File];
    }

    if (!rawFiles || rawFiles.length === 0) {
      res.status(400).json({ success: false, message: 'Kamida 1 ta rasm yuklanishi kerak' });
      return;
    }

    const urls = rawFiles.map((file) => `/uploads/${file.filename}`);

    res.status(200).json({
      success: true,
      message: 'Rasmlar muvaffaqiyatli yuklandi',
      urls,
      data: { urls },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/guide/experiences/:id/dates
 * Add an available date/slot to an experience.
 */
export async function addAvailableDate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const guideId = req.user!.sub;
    const { id } = req.params;
    const dto = req.body as AddAvailableDateDto;
    const dateSlot = await guideService.addGuideAvailableDate(guideId, id, dto);

    res.status(201).json({
      success: true,
      message: 'Available date slot added successfully',
      data: dateSlot,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/guide/dates/:dateId
 * Delete an available date/slot.
 */
export async function deleteAvailableDate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const guideId = req.user!.sub;
    const { dateId } = req.params;
    await guideService.deleteGuideAvailableDate(guideId, dateId);

    res.status(200).json({
      success: true,
      message: 'Available date slot deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/guide/bookings
 * Get all bookings for the guide's experiences.
 */
export async function getMyBookings(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const guideId = req.user!.sub;
    const bookings = await guideService.getGuideBookings(guideId);

    res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/guide/bookings/:id/status
 * Update booking status (CONFIRMED, COMPLETED, CANCELLED).
 */
export async function updateBookingStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const guideId = req.user!.sub;
    const { id } = req.params;
    const dto = req.body as UpdateBookingStatusDto;
    const booking = await guideService.updateGuideBookingStatus(guideId, id, dto);

    res.status(200).json({
      success: true,
      message: `Booking status updated to ${dto.status}`,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/guide/profile
 * Get authenticated guide profile.
 */
export async function getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const guideId = req.user!.sub;
    const user = await guideService.getGuideProfile(guideId);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/guide/profile
 * Update guide profile information.
 */
export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const guideId = req.user!.sub;
    const dto = req.body as UpdateGuideProfileDto;
    const user = await guideService.updateGuideProfile(guideId, dto);

    res.status(200).json({
      success: true,
      message: 'Profil ma\'lumotlari yangilandi',
      data: user,
    });
  } catch (error) {
    next(error);
  }
}
