import { api } from './api';
import type { ApiResponse, AuthResponseData, User, RefreshTokenDto, UserRole } from '../types/auth';

/**
 * Send Google ID token and optional target role to backend for OAuth authentication
 */
export async function googleLogin(idToken: string, role?: UserRole): Promise<ApiResponse<AuthResponseData>> {
  const response = await api.post<ApiResponse<AuthResponseData>>('/auth/google', { idToken, role });
  return response.data;
}

/**
 * Get current authenticated user profile
 */
export async function getCurrentUser(): Promise<ApiResponse<User>> {
  const response = await api.get<ApiResponse<User>>('/auth/me');
  return response.data;
}

/**
 * Refresh access token using refresh token
 */
export async function refreshToken(data: RefreshTokenDto): Promise<ApiResponse<{ accessToken: string; refreshToken: string }>> {
  const response = await api.post<ApiResponse<{ accessToken: string; refreshToken: string }>>('/auth/refresh', data);
  return response.data;
}
