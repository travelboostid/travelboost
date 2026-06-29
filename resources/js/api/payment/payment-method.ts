import { useQuery } from '@tanstack/react-query';

import { apiInstance } from '../api-instance';

export type PaymentMethodUsageScope = 'booking' | 'platform';

export type PaymentMethodResource = {
    id: number;
    name: string;
    description: string | null;
    provider: string;
    usage_scope?: PaymentMethodUsageScope | null;
    method: string;
    category: 'banktransfer' | 'creditcard' | 'conveniencestore' | 'qris';
    meta: Record<string, unknown> | null;
    status: string;
    created_at: string | null;
    updated_at: string | null;
};

type PaymentMethodCollectionResponse =
    | PaymentMethodResource[]
    | {
          data?: PaymentMethodResource[];
      };

function normalizePaymentMethods(
    response: PaymentMethodCollectionResponse | null | undefined,
): PaymentMethodResource[] {
    if (Array.isArray(response)) {
        return response;
    }

    if (Array.isArray(response?.data)) {
        return response.data;
    }

    return [];
}

export const getPaymentMethods = (
    usageScope?: PaymentMethodUsageScope,
    signal?: AbortSignal,
) => {
    return apiInstance<PaymentMethodCollectionResponse>({
        url: '/payment-methods',
        method: 'GET',
        params: usageScope ? { usage_scope: usageScope } : undefined,
        signal,
    });
};

export const usePaymentMethods = (
    usageScope: PaymentMethodUsageScope = 'booking',
) => {
    return useQuery({
        queryKey: ['paymentMethods', usageScope],
        queryFn: async ({ signal }) =>
            normalizePaymentMethods(
                await getPaymentMethods(usageScope, signal),
            ),
        staleTime: 5 * 60 * 1000,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
    });
};
