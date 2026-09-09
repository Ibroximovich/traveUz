import { Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { AuthRequest } from '../types';
import { localizedErrors } from '../utils/i18n';

/**
 * Role-based access control middleware.
 * Must be used AFTER the authenticate middleware.
 * @param roles - One or more allowed roles
 */
export function requireRole(...roles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const lang = req.lang || 'uz';
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: localizedErrors.unauthorized[lang] || localizedErrors.unauthorized.uz,
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: localizedErrors.forbidden[lang] || localizedErrors.forbidden.uz,
      });
      return;
    }

    next();
  };
}
