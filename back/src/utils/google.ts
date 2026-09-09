import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env';
import { GoogleTokenPayload } from '../types';

const client = new OAuth2Client(env.googleClientId);

/**
 * Verify Google ID Token and return the decoded payload.
 * Supports mock base64 token, official Google ID Token verification, and dev fallback.
 */
export async function verifyGoogleToken(idToken: string): Promise<GoogleTokenPayload> {
  // ── 1. Development mock base64 mode ──────────────────────────────────────────
  if (env.isDev) {
    try {
      const decoded = Buffer.from(idToken, 'base64').toString('utf-8');
      if (decoded.startsWith('{') && decoded.endsWith('}')) {
        const payload = JSON.parse(decoded);
        if (payload.email && payload.sub) {
          console.warn('⚠️  Using mock Google token verification (development mode)');
          return payload as GoogleTokenPayload;
        }
      }
    } catch {
      // Not base64 encoded JSON, proceed to real Google verification
    }
  }

  // ── 2. Real Google OAuth ID Token verification ──────────────────────────────
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: env.googleClientId,
    });

    const payload = ticket.getPayload();
    if (payload?.email && payload?.sub) {
      return {
        sub: payload.sub,
        email: payload.email,
        name: payload.name ?? payload.email,
        picture: payload.picture,
        email_verified: payload.email_verified ?? true,
      };
    }
  } catch (err) {
    // ── 3. Dev Mode fallback for unverified JWTs / Audience mismatches ────────
    if (env.isDev) {
      try {
        const parts = idToken.split('.');
        if (parts.length === 3) {
          const payloadJson = Buffer.from(parts[1], 'base64').toString('utf-8');
          const payload = JSON.parse(payloadJson);
          if (payload.email && payload.sub) {
            console.warn('⚠️  Decoded real Google JWT token (Development Mode)');
            return {
              sub: payload.sub,
              email: payload.email,
              name: payload.name ?? payload.email,
              picture: payload.picture,
              email_verified: true,
            };
          }
        }
      } catch {
        // Ignore fallback error and throw original error below
      }
    }
    throw err;
  }

  throw new Error('Invalid Google token payload');
}
