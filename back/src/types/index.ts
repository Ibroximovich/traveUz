import { Request } from 'express';
import { Role } from '@prisma/client';

// ─── JWT Payload ───────────────────────────────────────────────────────────────
export interface JwtPayload {
  sub: string;  // userId
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

// ─── Authenticated Request ─────────────────────────────────────────────────────
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// ─── Standard API Response ─────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  meta?: PaginationMeta;
}

// ─── Pagination ────────────────────────────────────────────────────────────────
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

// ─── Google Token Payload ──────────────────────────────────────────────────────
export interface GoogleTokenPayload {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  email_verified?: boolean;
}

// ─── Commission Report ─────────────────────────────────────────────────────────
export interface CommissionReport {
  guideId: string;
  guideName: string;
  guideEmail: string;
  totalBookings: number;
  totalRevenue: number;
  platformCommission: number;
  netPayout: number;
}
