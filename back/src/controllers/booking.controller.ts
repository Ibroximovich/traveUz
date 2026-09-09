import { Response, NextFunction } from 'express';
import * as bookingService from '../services/booking.service';
import { AuthRequest } from '../types';
import { CreateBookingDto, CheckoutDto } from '../schemas/booking.schema';

/**
 * POST /api/bookings
 * Create a new booking for the authenticated tourist.
 */
export async function createBooking(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.sub;
    const dto = req.body as CreateBookingDto;
    const booking = await bookingService.createBooking(userId, dto);

    res.status(201).json({
      success: true,
      message: 'Booking created. Please complete payment to confirm.',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/payments/checkout
 * Process mock payment and confirm the booking.
 */
export async function processCheckout(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.sub;
    const dto = req.body as CheckoutDto;
    const booking = await bookingService.processCheckout(userId, dto);

    res.status(200).json({
      success: true,
      message: 'Payment successful! Your booking is confirmed.',
      data: {
        booking,
        voucherCode: booking.voucherCode,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/bookings/my
 * Get all bookings for the authenticated tourist.
 */
export async function getMyBookings(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.sub;
    const bookings = await bookingService.getTouristBookings(userId);

    res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
}
