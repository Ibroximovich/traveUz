import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtPayload } from '../types';

/**
 * Generate a short-lived access token
 */
export function generateAccessToken(payload: JwtPayload): string {
  const options: SignOptions = {
    expiresIn: env.jwtAccessExpiresIn as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.jwtSecret, options);
}

/**
 * Generate a long-lived refresh token
 */
export function generateRefreshToken(payload: JwtPayload): string {
  const options: SignOptions = {
    expiresIn: env.jwtRefreshExpiresIn as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.jwtSecret, options);
}

/**
 * Verify a JWT token and return its decoded payload
 */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
}

/**
 * Extract token from Authorization: Bearer <token> header
 */
export function extractBearerToken(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.split(' ')[1];
}
