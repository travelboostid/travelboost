import { PLATFORM_FEE_PER_PAX, PPN_RATE } from '@/constants/booking';
import type { BookingPricing, GuestEntry } from '@/types/booking';

/**
 * THE ONLY PLACE where frontend pricing math exists. Never duplicate this logic.
 */
export function calculateBookingPricing(
  guests: GuestEntry[],
  agentCommission: number,
): BookingPricing {
  const subtotalGuests = guests.reduce(
    (sum, g) => sum + (g.price ?? 0),
    0,
  );
  const paxCount = guests.length;
  const platformFee = paxCount * PLATFORM_FEE_PER_PAX;
  const ppn = Math.round(subtotalGuests * PPN_RATE);
  const agentFee = agentCommission;
  const totalPrice = subtotalGuests + platformFee + ppn + agentFee;
  const totalPayment = totalPrice; // update here when discounts are introduced

  return {
    subtotalGuests,
    platformFee,
    ppn,
    agentCommission: agentFee,
    totalPrice,
    totalPayment,
    paxCount,
  };
}
