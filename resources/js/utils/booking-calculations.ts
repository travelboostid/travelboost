import type { BookingPricing, GuestEntry, TourPrice } from '@/types/booking';

type AddOnPricingItem = {
    unitPrice: number;
    qty: number;
    isTaxable?: boolean;
};

function commissionForGuest(
    guest: GuestEntry,
    tourPrices: TourPrice[],
    selectedAgentId?: number | null,
): number {
    const selectedPrice = tourPrices.find((price) =>
        guest.tourPriceId > 0
            ? price.tourPriceId === guest.tourPriceId
            : price.categoryName === guest.priceCategory,
    );

    if (!selectedPrice) {
        return 0;
    }

    const agentCommission =
        selectedAgentId !== null && selectedAgentId !== undefined
            ? selectedPrice.agentCommissionsByAgentId?.[String(selectedAgentId)]
            : selectedPrice.effectiveCommission;

    if (typeof agentCommission === 'number') {
        return agentCommission;
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
    vatPct: number = 0,
    platformFeePerPax: number = 25_000,
    tourPrices: TourPrice[] = [],
    selectedAgentId?: number | null,
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
    const visaTotal = guests.reduce(
        (sum, g) => sum + (g.visaTypePrice ?? 0),
        0,
    );
    const taxableVisaTotal = guests.reduce(
        (sum, g) => (g.visaTypeIsTaxable ? sum + (g.visaTypePrice ?? 0) : sum),
        0,
    );
    const paxCount = guests.length;
    const platformFee = paxCount * platformFeePerPax;
    const ppn = Math.round(
        (discountedSubtotal + taxableVisaTotal) * (vatPct / 100),
    );
    const calculatedAgentCommission = tourPrices.length
        ? guests.reduce(
              (sum, guest) =>
                  sum + commissionForGuest(guest, tourPrices, selectedAgentId),
              0,
          )
        : 0;
    const agentFee = tourPrices.length
        ? calculatedAgentCommission
        : agentCommission;
    const totalPrice = discountedSubtotal + visaTotal + platformFee + ppn;
    const totalPayment = totalPrice;

    return {
        subtotalGuests,
        discountedSubtotal,
        promotionDiscount,
        visaTotal,
        taxableVisaTotal,
        platformFee,
        ppn,
        agentCommission: agentFee,
        totalPrice,
        totalPayment,
        paxCount,
    };
}

export function calculateAddOnPricing(
    addOns: AddOnPricingItem[],
    vatPct: number = 0,
) {
    const addOnsTotal = addOns.reduce(
        (sum, addOn) => sum + addOn.unitPrice * addOn.qty,
        0,
    );
    const taxableAddOnsTotal = addOns.reduce(
        (sum, addOn) =>
            addOn.isTaxable ? sum + addOn.unitPrice * addOn.qty : sum,
        0,
    );
    const addOnsVat = Math.round(taxableAddOnsTotal * (vatPct / 100));

    return {
        addOnsTotal,
        taxableAddOnsTotal,
        addOnsVat,
    };
}
