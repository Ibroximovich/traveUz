import { Router } from 'express';
import { googleLogin, getMe } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { googleAuthSchema } from '../schemas/auth.schema';

const router = Router();

/**
 * POST /api/auth/google
 * Verify Google ID token and return JWT
 */
router.post('/google', validate(googleAuthSchema), googleLogin);

/**
 * GET /api/auth/me
 * Get current authenticated user's profile
 */
router.get('/me', authenticate, getMe);

export default router;
