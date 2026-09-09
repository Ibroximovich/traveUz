import { Router } from 'express';
import {
  createBooking,
  processCheckout,
  getMyBookings,
} from '../controllers/booking.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createBookingSchema, checkoutSchema } from '../schemas/booking.schema';

const router = Router();

// All booking routes require authentication
router.use(authenticate);

/**
 * GET /api/bookings/my
 * Tourist: Get all my bookings
 */
router.get('/my', getMyBookings);

/**
 * POST /api/bookings
 * Tourist: Create a new booking
 */
router.post('/', validate(createBookingSchema), createBooking);

/**
 * POST /api/payments/checkout
 * Tourist: Pay for a pending booking (mock payment)
 * Note: Mounted at /api/payments/checkout in index routes
 */
router.post('/checkout', validate(checkoutSchema), processCheckout);

export default router;
