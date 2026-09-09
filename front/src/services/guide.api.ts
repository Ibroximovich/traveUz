import { api } from './api';
import { useAuthStore } from '../store/useAuthStore';
import type { ApiResponse } from '../types/auth';
import type {
  Experience,
  AvailableDate,
  CreateExperienceDto,
  UpdateExperienceDto,
  AddAvailableDateDto,
  Booking,
  GuideStats,
  GuideProfile,
} from '../types/experience';

/**
 * Get dashboard statistics for guide
 */
export async function getGuideStats(): Promise<ApiResponse<GuideStats>> {
  const response = await api.get<ApiResponse<GuideStats>>('/guide/stats');
  return response.data;
}

/**
 * Get all experiences belonging to the authenticated guide
 */
export async function getGuideExperiences(): Promise<ApiResponse<Experience[]>> {
  const response = await api.get<ApiResponse<Experience[]>>('/guide/experiences');
  return response.data;
}

/**
 * Create a new experience / tour
 */
export async function createExperience(dto: CreateExperienceDto): Promise<ApiResponse<Experience>> {
  const response = await api.post<ApiResponse<Experience>>('/guide/experiences', dto);
  return response.data;
}

/**
 * Edit an existing experience / tour
 */
export async function updateExperience(id: string, dto: UpdateExperienceDto): Promise<ApiResponse<Experience>> {
  const response = await api.put<ApiResponse<Experience>>(`/guide/experiences/${id}`, dto);
  return response.data;
}

/**
 * Toggle active/inactive status of an experience
 */
export async function toggleExperienceStatus(id: string): Promise<ApiResponse<Experience>> {
  const response = await api.patch<ApiResponse<Experience>>(`/guide/experiences/${id}/status`);
  return response.data;
}

/**
 * Delete an experience / tour
 */
export async function deleteExperience(id: string): Promise<ApiResponse<void>> {
  const response = await api.delete<ApiResponse<void>>(`/guide/experiences/${id}`);
  return response.data;
}

/**
 * Upload experience images (multipart/form-data)
 */
export async function uploadExperienceImages(files: File[]): Promise<ApiResponse<{ urls: string[] }>> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('images', file);
  });
  const token = useAuthStore.getState().accessToken;
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await api.post<ApiResponse<{ urls: string[] }>>('/guide/upload', formData, {
    headers,
  });
  return response.data;
}

/**
 * Add an available date / slot to an experience
 */
export async function addAvailableDate(
  experienceId: string,
  dto: AddAvailableDateDto
): Promise<ApiResponse<AvailableDate>> {
  const response = await api.post<ApiResponse<AvailableDate>>(`/guide/experiences/${experienceId}/dates`, dto);
  return response.data;
}

/**
 * Delete an available date / slot
 */
export async function deleteAvailableDate(dateId: string): Promise<ApiResponse<void>> {
  const response = await api.delete<ApiResponse<void>>(`/guide/dates/${dateId}`);
  return response.data;
}

/**
 * Get all bookings for guide's experiences
 */
export async function getGuideBookings(): Promise<ApiResponse<Booking[]>> {
  const response = await api.get<ApiResponse<Booking[]>>('/guide/bookings');
  return response.data;
}

/**
 * Update status of a booking (CONFIRMED, COMPLETED, CANCELLED)
 */
export async function updateBookingStatus(bookingId: string, status: string): Promise<ApiResponse<Booking>> {
  const response = await api.patch<ApiResponse<Booking>>(`/guide/bookings/${bookingId}/status`, { status });
  return response.data;
}

/**
 * Get guide profile details
 */
export async function getGuideProfile(): Promise<ApiResponse<GuideProfile>> {
  const response = await api.get<ApiResponse<GuideProfile>>('/guide/profile');
  return response.data;
}

/**
 * Update guide profile details
 */
export async function updateGuideProfile(dto: Partial<GuideProfile>): Promise<ApiResponse<GuideProfile>> {
  const response = await api.put<ApiResponse<GuideProfile>>('/guide/profile', dto);
  return response.data;
}
