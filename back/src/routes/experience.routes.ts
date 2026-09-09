import { Router } from 'express';
import { listExperiences, getExperience } from '../controllers/experience.controller';
import { validate } from '../middlewares/validate.middleware';
import { experienceQuerySchema } from '../schemas/experience.schema';

const router = Router();

/**
 * GET /api/experiences
 * Public: List experiences (filterable by city, paginated)
 */
router.get('/', validate(experienceQuerySchema, 'query'), listExperiences);

/**
 * GET /api/experiences/:id
 * Public: Get a single experience with full details and available dates
 */
router.get('/:id', getExperience);

export default router;
