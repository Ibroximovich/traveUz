import { z } from 'zod';

/**
 * Schema for POST /api/auth/google
 */
export const googleAuthSchema = z.object({
  idToken: z.string({ required_error: 'idToken is required' }).min(1, 'idToken cannot be empty'),
});

export type GoogleAuthDto = z.infer<typeof googleAuthSchema>;
