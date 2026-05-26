import type { BookingPricing, GuestEntry, TourPrice } from '@/types/booking';

function commissionForGuest(
    guest: GuestEntry,
    tourPrices: TourPrice[],
): number {
    const selectedPrice = tourPrices.find((price) =>
        guest.tourPriceId > 0
            ? price.tourPriceId === guest.tourPriceId
            : price.categoryName === guest.priceCategory,
    );

    if (!selectedPrice) {
        return 0;
    }

    const fixedCommission = Number(selectedPrice.commission ?? 0);
    if (fixedCommission > 0) {
        return fixedCommission;
    }

    const commissionRate = Number(selectedPrice.commissionRate ?? 0);
    if (commissionRate <= 0) {
        return 0;
    }

    return Math.round((guest.price ?? 0) * (commissionRate / 100));
}

/**
 * THE ONLY PLACE where frontend pricing math exists. Never duplicate this logic.
 */
export function calculateBookingPricing(
    guests: GuestEntry[],
    agentCommission: number,
    vatPct: number = 11,
    platformFeePerPax: number = 25_000,
    tourPrices: TourPrice[] = [],
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
    const ppn = Math.round(discountedSubtotal * (vatPct / 100));
    const calculatedAgentCommission = tourPrices.length
        ? guests.reduce(
              (sum, guest) => sum + commissionForGuest(guest, tourPrices),
              0,
          )
        : 0;
    const agentFee = tourPrices.length
        ? calculatedAgentCommission
        : agentCommission;
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
