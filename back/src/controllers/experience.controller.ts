import { Request, Response, NextFunction } from 'express';
import * as experienceService from '../services/experience.service';
import { ExperienceQueryDto } from '../schemas/experience.schema';

/**
 * GET /api/experiences
 * Returns paginated list of experiences filtered by city, localized to requested lang.
 */
export async function listExperiences(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = req.query as unknown as ExperienceQueryDto;
    const result = await experienceService.getExperiences(query, req.lang);

    res.status(200).json({
      success: true,
      data: result.experiences,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/experiences/:id
 * Returns full experience details with available dates, localized to requested lang.
 */
export async function getExperience(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const experience = await experienceService.getExperienceById(id, req.lang);

    res.status(200).json({
      success: true,
      data: experience,
    });
  } catch (error) {
    next(error);
  }
}
