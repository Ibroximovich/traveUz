import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import { AuthRequest } from '../types';

/**
 * POST /api/auth/google
 * Accepts Google ID token, verifies it, upserts user, returns JWT tokens.
 */
export async function googleLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { idToken } = req.body;
    const result = await authService.loginWithGoogle(idToken);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/auth/me
 * Returns the authenticated user's profile.
 */
export async function getMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.sub;
    const user = await authService.getMe(userId);

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}
