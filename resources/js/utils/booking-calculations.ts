import type { BookingPricing, GuestEntry } from '@/types/booking';

/**
 * THE ONLY PLACE where frontend pricing math exists. Never duplicate this logic.
 */
export function calculateBookingPricing(
    guests: GuestEntry[],
    agentCommission: number,
    vatPct: number = 11,
    platformFeePerPax: number = 25_000,
): BookingPricing {
    const subtotalGuests = guests.reduce(
        (sum, g) => sum + (g.originalPrice ?? g.price ?? 0),
        0,
    );
    const discountedSubtotal = guests.reduce(
        (sum, g) => sum + (g.price ?? 0),
        0,
    );
    const promotionDiscount = Math.max(0, subtotalGuests - discountedSubtotal);
    const paxCount = guests.length;
    const platformFee = paxCount * platformFeePerPax;
    const ppn = Math.round(subtotalGuests * (vatPct / 100));
    const agentFee = agentCommission;
    const totalPrice = discountedSubtotal + platformFee + ppn;
    const totalPayment = totalPrice;

    return {
        subtotalGuests,
        discountedSubtotal,
        promotionDiscount,
        platformFee,
        ppn,
        agentCommission: agentFee,
        totalPrice,
        totalPayment,
        paxCount,
    };
}
