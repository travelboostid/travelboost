import { useQuery } from '@tanstack/react-query';

import { apiInstance } from '../api-instance';

export type PaymentMethodResource = {
    id: number;
    name: string;
    description: string | null;
    provider: string;
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

export const getPaymentMethods = (signal?: AbortSignal) => {
    return apiInstance<PaymentMethodCollectionResponse>({
        url: '/payment-methods',
        method: 'GET',
        signal,
    });
};

export const usePaymentMethods = () => {
    return useQuery({
        queryKey: ['paymentMethods'],
        queryFn: async ({ signal }) =>
            normalizePaymentMethods(await getPaymentMethods(signal)),
    });
};
