import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique voucher code for a booking.
 * Format: TRP-XXXXXXXX (8 uppercase alphanumeric chars)
 */
export function generateVoucherCode(): string {
  const raw = uuidv4().replace(/-/g, '').toUpperCase().substring(0, 8);
  return `TRP-${raw}`;
}
