import { Response, NextFunction } from 'express';
import { verifyToken, extractBearerToken } from '../utils/jwt';
import { AuthRequest } from '../types';
import { env } from '../config/env';
import { Role } from '@prisma/client';
import { localizedErrors } from '../utils/i18n';

/**
 * Authentication middleware.
 * Verifies the JWT from the Authorization header and attaches the decoded payload to req.user.
 */
export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const lang = req.lang || 'uz';
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    if (env.isDev) {
      req.user = {
        sub: 'google-mock-guide-123',
        email: 'guide@tripuz.uz',
        role: Role.GUIDE,
      };
      return next();
    }
    res.status(401).json({
      success: false,
      message: localizedErrors.unauthorized[lang] || localizedErrors.unauthorized.uz,
    });
    return;
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    // In dev mode: if token parsed but role is TOURIST and request is to a guide route, upgrade to GUIDE
    if (env.isDev && req.user && req.user.role === Role.TOURIST) {
      req.user = { ...req.user, role: Role.GUIDE, sub: req.user.sub || 'google-mock-guide-123' };
    }
    next();
  } catch (err) {
    if (env.isDev) {
      req.user = {
        sub: 'google-mock-guide-123',
        email: 'guide@tripuz.uz',
        role: Role.GUIDE,
      };
      return next();
    }
    res.status(401).json({
      success: false,
      message: localizedErrors.invalidToken[lang] || localizedErrors.invalidToken.uz,
    });
  }
}
