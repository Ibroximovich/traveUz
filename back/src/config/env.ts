import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string({ required_error: 'DATABASE_URL is required' }),
  JWT_SECRET: z.string({ required_error: 'JWT_SECRET is required' }).min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  GOOGLE_CLIENT_ID: z.string({ required_error: 'GOOGLE_CLIENT_ID is required' }),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  COMMISSION_RATE: z.string().default('0.10'),
  CLIENT_URL: z.string().default('http://localhost:3000'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  port: parseInt(parsed.data.PORT, 10),
  nodeEnv: parsed.data.NODE_ENV,
  databaseUrl: parsed.data.DATABASE_URL,
  jwtSecret: parsed.data.JWT_SECRET,
  jwtAccessExpiresIn: parsed.data.JWT_ACCESS_EXPIRES_IN,
  jwtRefreshExpiresIn: parsed.data.JWT_REFRESH_EXPIRES_IN,
  googleClientId: parsed.data.GOOGLE_CLIENT_ID,
  googleClientSecret: parsed.data.GOOGLE_CLIENT_SECRET,
  commissionRate: parseFloat(parsed.data.COMMISSION_RATE),
  clientUrl: parsed.data.CLIENT_URL,
  isDev: parsed.data.NODE_ENV === 'development',
  isProd: parsed.data.NODE_ENV === 'production',
};
