import { z } from 'zod';

/**
 * Schema for POST /api/bookings (create booking)
 */
export const createBookingSchema = z.object({
  experienceId: z.string({ required_error: 'experienceId is required' }),
  slotId: z.string().optional(),
  dateId: z.string().optional(),
  numPeople: z.number().int().positive().optional(),
  participantsCount: z.number().int().positive().optional(),
  touristName: z.string().optional(),
  touristEmail: z.string().optional(),
  touristPhone: z.string().optional(),
});

/**
 * Schema for POST /api/payments/checkout
 */
export const checkoutSchema = z.object({
  bookingId: z.string({ required_error: 'bookingId is required' }).cuid('Invalid booking ID'),
  // Mock card data (MVP only - never store real card data)
  card: z.object({
    number: z
      .string()
      .regex(/^\d{16}$/, 'Card number must be 16 digits'),
    expiry: z
      .string()
      .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Card expiry must be MM/YY format'),
    cvv: z
      .string()
      .regex(/^\d{3,4}$/, 'CVV must be 3 or 4 digits'),
    holderName: z.string().min(2, 'Card holder name is required'),
  }),
});

/**
 * Schema for PATCH /api/guide/bookings/:id/status
 */
export const updateBookingStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'COMPLETED', 'CANCELLED'], {
    required_error: 'status is required',
    invalid_type_error: "status must be one of: CONFIRMED, COMPLETED, CANCELLED",
  }),
});

export type CreateBookingDto = z.infer<typeof createBookingSchema>;
export type CheckoutDto = z.infer<typeof checkoutSchema>;
export type UpdateBookingStatusDto = z.infer<typeof updateBookingStatusSchema>;
