import { Role, User } from '@prisma/client';
import prisma from '../config/prisma';
import { verifyGoogleToken } from '../utils/google';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { JwtPayload } from '../types';
import { HttpError } from '../middlewares/error.middleware';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: Omit<User, 'updatedAt'>;
}

/**
 * Verify Google ID token, find or create the user, and return JWTs.
 */
export async function loginWithGoogle(idToken: string): Promise<AuthTokens> {
  const googlePayload = await verifyGoogleToken(idToken);

  const userRole = (googlePayload.email.includes('guide') || googlePayload.email.includes('jasur'))
    ? Role.GUIDE
    : Role.TOURIST;

  const targetId = googlePayload.sub && googlePayload.sub.startsWith('google-mock-') ? googlePayload.sub : undefined;

  // Find existing user to check if custom avatar was already uploaded
  const existingUser = await prisma.user.findUnique({
    where: { email: googlePayload.email },
  });

  const shouldUpdateAvatar = !existingUser?.isCustomAvatarUploaded;

  const user = await prisma.user.upsert({
    where: { email: googlePayload.email },
    update: {
      name: googlePayload.name,
      role: userRole,
      ...(shouldUpdateAvatar ? { avatar: googlePayload.picture } : {}),
    },
    create: {
      id: targetId,
      email: googlePayload.email,
      name: googlePayload.name,
      avatar: googlePayload.picture,
      isCustomAvatarUploaded: false,
      role: userRole,
    },
  });

  const jwtPayload: JwtPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };

  return {
    accessToken: generateAccessToken(jwtPayload),
    refreshToken: generateRefreshToken(jwtPayload),
    user,
  };
}

/**
 * Get the authenticated user's profile by userId.
 */
export async function getMe(userId: string): Promise<User> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new HttpError(404, 'User not found');
  return user;
}
