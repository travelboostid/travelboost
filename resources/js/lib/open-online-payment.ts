import {
    hasOnlinePaymentInstructions,
    isPendingOnlinePayment,
    type PaymentInstructionPayload,
} from '@/lib/payment-instructions';
import type {
    PaymentStatusCheckConfig,
    PaymentStatusSyncResult,
} from '@/lib/payment-status';

type OnlinePayment = {
    id?: number | string | null;
    status?: string | null;
    provider?: string | null;
    amount?: number | null;
    payload?: unknown;
};

type OnlinePaymentCallbacks = {
    onComplete?: () => void;
    onPaid?: (result?: PaymentStatusSyncResult) => void;
    statusCheck?: PaymentStatusCheckConfig;
    /** Reload Inertia page props after payment is confirmed. Defaults to true. */
    reloadOnPaid?: boolean;
};

export type OnlinePaymentOpenDetail = {
    payment: OnlinePayment;
    callbacks?: OnlinePaymentCallbacks;
    statusCheck?: PaymentStatusCheckConfig;
};

export const ONLINE_PAYMENT_OPEN_EVENT = 'online-payment:open';

const PRISMALINK_SANDBOX_WEB_BASE_URL = 'https://secure2-staging.plink.co.id';
const PRISMALINK_PRODUCTION_WEB_BASE_URL = 'https://secure3.plink.co.id';

function resolvePrismaLinkPaymentPageUrl(url: string): string {
    const configuredBase = import.meta.env.VITE_PRISMALINK_WEB_BASE_URL as
        | string
        | undefined;
    const defaultBase =
        import.meta.env.VITE_PRISMALINK_IS_PRODUCTION === 'true'
            ? PRISMALINK_PRODUCTION_WEB_BASE_URL
            : PRISMALINK_SANDBOX_WEB_BASE_URL;
    const webBaseUrl = (configuredBase ?? defaultBase).replace(/\/$/, '');

    if (/^https?:\/\//i.test(url)) {
        try {
            const parsed = new URL(url);

            if (parsed.hostname.includes('plink.co.io')) {
                return url;
            }

            if (parsed.hostname.includes('plink.co.id')) {
                return url;
            }

            if (
                parsed.pathname.includes('/paymentpage/') ||
                parsed.pathname.includes('/directdebit/') ||
                parsed.pathname.includes('/creditcard/')
            ) {
                return `${webBaseUrl}${parsed.pathname}${parsed.search}`;
            }
        } catch {
            return url;
        }

        return url;
    }

    return `${webBaseUrl}${url.startsWith('/') ? url : `/${url}`}`;
}

function canOpenOnlinePaymentDialog(
    payment: OnlinePayment,
    payload: PaymentInstructionPayload,
): boolean {
    if (hasOnlinePaymentInstructions(payment.provider, payload)) {
        return true;
    }

    return isPendingOnlinePayment(payment.provider, payment.status, payment.id);
}

function dispatchOpenOnlinePayment(
    payment: OnlinePayment,
    callbacks?: OnlinePaymentCallbacks,
    options?: { statusCheck?: PaymentStatusCheckConfig },
): void {
    // Defer so the triggering click does not immediately dismiss the dialog.
    window.setTimeout(() => {
        window.dispatchEvent(
            new CustomEvent<OnlinePaymentOpenDetail>(
                ONLINE_PAYMENT_OPEN_EVENT,
                {
                    detail: {
                        payment,
                        callbacks,
                        statusCheck:
                            options?.statusCheck ?? callbacks?.statusCheck,
                    },
                },
            ),
        );
    }, 0);
}

export function openOnlinePayment(
    payment: OnlinePayment,
    callbacks?: OnlinePaymentCallbacks,
    options?: { statusCheck?: PaymentStatusCheckConfig },
): void {
    const payload = (payment.payload ?? {}) as PaymentInstructionPayload;

    if (canOpenOnlinePaymentDialog(payment, payload)) {
        dispatchOpenOnlinePayment(payment, callbacks, options);

        return;
    }

    if (
        payment.provider === 'prismalink' &&
        typeof payload.payment_page_url === 'string'
    ) {
        window.setTimeout(() => {
            window.location.href = resolvePrismaLinkPaymentPageUrl(
                payload.payment_page_url!,
            );
        }, 0);

        return;
    }

    callbacks?.onComplete?.();
}
