import { apiInstance } from '@/api/api-instance';
import type { PaymentResource } from '@/api/model/paymentResource';
import type { PaymentStatus } from '@/api/model/paymentStatus';
import axios from 'axios';

export const PAYMENT_STATUS_POLL_INTERVAL_MS = 10_000;

export type PaymentStatusCheckConfig = {
    url: string;
    method?: 'GET' | 'POST';
};

export type PaymentStatusSyncResult = {
    payment: PaymentResource;
    previousStatus: PaymentStatus | string;
    status: PaymentStatus | string;
    changed: boolean;
    transactionStatus?: string | null;
    bookingPaymentResult?: Record<string, unknown>;
};

export type PaymentStatusNotice = {
    tone: 'info' | 'success' | 'warning' | 'danger';
    title: string;
    body: string;
};

export function defaultPaymentStatusCheckUrl(
    paymentId: number | string,
): string {
    return `/webapi/payments/${paymentId}/sync-status`;
}

export function paymentStatusLabel(status: string | null | undefined): string {
    switch (status) {
        case 'paid':
            return 'Paid';
        case 'pending':
            return 'Pending';
        case 'unpaid':
            return 'Unpaid';
        case 'failed':
            return 'Failed';
        case 'expired':
            return 'Expired';
        case 'cancelled':
            return 'Cancelled';
        case 'refunded':
            return 'Refunded';
        default:
            return status ? status.replace(/_/g, ' ') : 'Unknown';
    }
}

export function paymentStatusNotice(
    status: string,
    changed: boolean,
): PaymentStatusNotice | null {
    if (status === 'paid') {
        return {
            tone: 'success',
            title: changed ? 'Payment received' : 'Payment confirmed',
            body: changed
                ? 'Your payment has been confirmed by the provider.'
                : 'This payment is already marked as paid.',
        };
    }

    if (status === 'failed' || status === 'expired' || status === 'cancelled') {
        return {
            tone: 'danger',
            title: 'Payment not completed',
            body:
                status === 'expired'
                    ? 'This payment attempt has expired. Start a new payment if you still need to pay.'
                    : 'The provider reported that this payment was not completed.',
        };
    }

    if (changed) {
        return {
            tone: 'info',
            title: 'Status updated',
            body: `Payment status is now ${paymentStatusLabel(status).toLowerCase()}.`,
        };
    }

    return null;
}

function normalizePaymentFromResponse(
    data: Record<string, unknown>,
): PaymentResource {
    if (data.data && typeof data.data === 'object') {
        return data.data as PaymentResource;
    }

    return data as PaymentResource;
}

export async function checkPaymentStatus(
    paymentId: number | string,
    config?: PaymentStatusCheckConfig,
): Promise<PaymentStatusSyncResult> {
    const check = config ?? {
        url: defaultPaymentStatusCheckUrl(paymentId),
        method: 'POST',
    };

    const isWebapiCheck =
        check.url.includes('/webapi/') || check.url.startsWith('/payments/');

    if (isWebapiCheck) {
        const response = await apiInstance<{
            data: PaymentResource;
            meta?: {
                previous_status?: string;
                changed?: boolean;
                transaction_status?: string | null;
            };
        }>({
            url: check.url.replace(/^\/webapi/, ''),
            method: check.method ?? 'POST',
        });

        const payment =
            response.data ??
            normalizePaymentFromResponse(
                response as unknown as Record<string, unknown>,
            );
        const meta = response.meta ?? {};

        return {
            payment,
            previousStatus: meta.previous_status ?? payment.status,
            status: payment.status,
            changed: Boolean(meta.changed),
            transactionStatus: meta.transaction_status ?? null,
        };
    }

    const response = await axios.request<Record<string, unknown>>({
        url: check.url,
        method: check.method ?? 'POST',
        withCredentials: true,
        withXSRFToken: true,
    });

    const paymentData = response.data?.payment ?? response.data;
    const payment = paymentData as PaymentResource;
    const nextStatus = String(
        (paymentData as { status?: string })?.status ??
            payment.status ??
            'pending',
    );

    return {
        payment: {
            ...payment,
            status: nextStatus as PaymentResource['status'],
        },
        previousStatus: payment.status,
        status: nextStatus,
        changed: false,
        transactionStatus:
            typeof payment.payload?.transaction_status === 'string'
                ? payment.payload.transaction_status
                : null,
        bookingPaymentResult: response.data?.bookingPaymentResult as
            | Record<string, unknown>
            | undefined,
    };
}

export function isTerminalPaymentStatus(
    status: string | null | undefined,
): boolean {
    return (
        status === 'paid' ||
        status === 'failed' ||
        status === 'expired' ||
        status === 'cancelled' ||
        status === 'refunded'
    );
}
