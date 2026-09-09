import { api } from './api';
import type { ApiResponse } from '../types/auth';
import type { Experience, Booking } from '../types/experience';

export interface CreateBookingDto {
  experienceId: string;
  slotId?: string;
  dateId?: string;
  numPeople?: number;
  participantsCount?: number;
  touristName?: string;
  touristEmail?: string;
  touristPhone?: string;
}

/**
 * Get public catalog of experiences
 */
export async function getPublicExperiences(params?: { city?: string; sort?: string }): Promise<ApiResponse<Experience[]>> {
  const response = await api.get<ApiResponse<Experience[]>>('/experiences', {
    params,
  });
  return response.data;
}

/**
 * Get detailed experience by ID with available date slots
 */
export async function getPublicExperienceById(id: string): Promise<ApiResponse<Experience>> {
  const response = await api.get<ApiResponse<Experience>>(`/experiences/${id}`);
  return response.data;
}

/**
 * Create a new tourist booking
 */
export async function createTouristBooking(dto: CreateBookingDto): Promise<ApiResponse<Booking>> {
  const response = await api.post<ApiResponse<Booking>>('/bookings', dto);
  return response.data;
}

/**
 * Process mock checkout / payment
 */
export async function checkoutTouristBooking(bookingId: string): Promise<ApiResponse<Booking>> {
  const response = await api.post<ApiResponse<Booking>>('/payments/checkout', { bookingId });
  return response.data;
}

/**
 * Get all my bookings for the authenticated tourist
 */
export async function getMyBookings(): Promise<ApiResponse<Booking[]>> {
  const response = await api.get<ApiResponse<Booking[]>>('/bookings/my');
  return response.data;
}
