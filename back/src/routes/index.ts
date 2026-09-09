import { Router } from 'express';
import authRoutes from './auth.routes';
import experienceRoutes from './experience.routes';
import bookingRoutes from './booking.routes';
import guideRoutes from './guide.routes';
import adminRoutes from './admin.routes';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { checkoutSchema } from '../schemas/booking.schema';
import { processCheckout } from '../controllers/booking.controller';

const router = Router();

// Health Check
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Tripuz API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

router.use('/auth', authRoutes);
router.use('/experiences', experienceRoutes);
router.use('/bookings', bookingRoutes);
router.post('/payments/checkout', authenticate, validate(checkoutSchema), processCheckout);
router.use('/guide', guideRoutes);
router.use('/admin', adminRoutes);

export default router;
