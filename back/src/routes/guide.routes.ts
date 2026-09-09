import { Router } from 'express';
import {
  getStats,
  getMyExperiences,
  createExperience,
  updateExperience,
  toggleExperienceStatus,
  deleteExperience,
  uploadImages,
  addAvailableDate,
  deleteAvailableDate,
  getMyBookings,
  updateBookingStatus,
  getProfile,
  updateProfile,
} from '../controllers/guide.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { uploadMiddleware } from '../utils/upload';
import { updateBookingStatusSchema } from '../schemas/booking.schema';
import {
  createGuideExperienceSchema,
  updateGuideExperienceSchema,
  addAvailableDateSchema,
  updateGuideProfileSchema,
} from '../schemas/experience.schema';

const router = Router();

// All guide routes require authentication and GUIDE or ADMIN role
router.use(authenticate, requireRole('GUIDE', 'ADMIN'));

/**
 * GET /api/guide/stats
 * Guide: Dashboard statistics
 */
router.get('/stats', getStats);

/**
 * GET /api/guide/experiences
 * Guide: View my own experiences
 */
router.get('/experiences', getMyExperiences);

/**
 * POST /api/guide/experiences
 * Guide: Create a new experience / tour
 */
router.post('/experiences', validate(createGuideExperienceSchema), createExperience);

/**
 * PUT /api/guide/experiences/:id
 * Guide: Edit an existing experience
 */
router.put('/experiences/:id', validate(updateGuideExperienceSchema), updateExperience);

/**
 * PATCH /api/guide/experiences/:id/status
 * Guide: Toggle active/inactive status
 */
router.patch('/experiences/:id/status', toggleExperienceStatus);

/**
 * DELETE /api/guide/experiences/:id
 * Guide: Delete an experience / tour
 */
router.delete('/experiences/:id', deleteExperience);

/**
 * POST /api/guide/upload
 * Guide: Upload tour images (multipart/form-data, max 5 images)
 */
router.post('/upload', uploadMiddleware.any(), uploadImages);

/**
 * POST /api/guide/experiences/:id/dates
 * Guide: Add an available date / slot to an experience
 */
router.post('/experiences/:id/dates', validate(addAvailableDateSchema), addAvailableDate);

/**
 * DELETE /api/guide/dates/:dateId
 * Guide: Delete an available date / slot
 */
router.delete('/dates/:dateId', deleteAvailableDate);

/**
 * GET /api/guide/bookings
 * Guide: View bookings for my experiences
 */
router.get('/bookings', getMyBookings);

/**
 * PATCH /api/guide/bookings/:id/status
 * Guide: Update booking status
 */
router.patch(
  '/bookings/:id/status',
  validate(updateBookingStatusSchema),
  updateBookingStatus,
);

/**
 * GET /api/guide/profile
 * Guide: Get profile info
 */
router.get('/profile', getProfile);

/**
 * PUT /api/guide/profile
 * Guide: Update profile info
 */
router.put('/profile', validate(updateGuideProfileSchema), updateProfile);

export default router;
