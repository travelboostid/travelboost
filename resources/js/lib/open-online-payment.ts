import { loadMidtransSnapScript, openMidtransSnap } from '@/lib/midtrans-snap';
import {
    hasOnlinePaymentInstructions,
    isPendingOnlinePayment,
    type PaymentInstructionPayload,
} from '@/lib/payment-instructions';
import {
    checkPaymentStatus,
    defaultPaymentStatusCheckUrl,
    type PaymentStatusCheckConfig,
    type PaymentStatusSyncResult,
} from '@/lib/payment-status';
import { toast } from 'sonner';

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
const SNAP_OPEN_DELAY_MS = 300;

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

async function syncSnapPaymentStatus(
    payment: OnlinePayment,
    callbacks?: OnlinePaymentCallbacks,
    options?: { statusCheck?: PaymentStatusCheckConfig },
): Promise<PaymentStatusSyncResult | null> {
    if (payment.id === null || payment.id === undefined) {
        return null;
    }

    const statusCheck = options?.statusCheck ??
        callbacks?.statusCheck ?? {
            url: defaultPaymentStatusCheckUrl(payment.id),
            method: 'POST',
        };

    try {
        return await checkPaymentStatus(payment.id, statusCheck);
    } catch {
        return null;
    }
}

function openMidtransSnapPayment(
    payment: OnlinePayment,
    callbacks?: OnlinePaymentCallbacks,
    options?: { statusCheck?: PaymentStatusCheckConfig },
): void {
    const payload = (payment.payload ?? {}) as PaymentInstructionPayload;
    const snapToken = payload.snap_token;

    if (typeof snapToken !== 'string' || snapToken.trim() === '') {
        toast.error(
            'Payment was created but Midtrans Snap token is missing. Please try again.',
        );
        dispatchOpenOnlinePayment(payment, callbacks, options);

        return;
    }

    window.setTimeout(() => {
        void loadMidtransSnapScript()
            .then(() => {
                openMidtransSnap(snapToken, {
                    onSuccess: () => {
                        void syncSnapPaymentStatus(
                            payment,
                            callbacks,
                            options,
                        ).then((result) => {
                            if (result?.status === 'paid') {
                                callbacks?.onPaid?.(result);
                                return;
                            }

                            callbacks?.onComplete?.();
                        });
                    },
                    onPending: () => {
                        void syncSnapPaymentStatus(
                            payment,
                            callbacks,
                            options,
                        ).then((result) => {
                            if (result?.status === 'paid') {
                                callbacks?.onPaid?.(result);
                                return;
                            }

                            callbacks?.onComplete?.();
                        });
                    },
                    onError: () => {
                        toast.error(
                            'Midtrans could not open the payment page. Use the payment dialog to try again.',
                        );
                        dispatchOpenOnlinePayment(payment, callbacks, options);
                    },
                    onClose: () => callbacks?.onComplete?.(),
                });
            })
            .catch((error: unknown) => {
                const message =
                    error instanceof Error
                        ? error.message
                        : 'Failed to load Midtrans Snap.';

                toast.error(message);
                dispatchOpenOnlinePayment(payment, callbacks, options);
            });
    }, SNAP_OPEN_DELAY_MS);
}

export function openOnlinePayment(
    payment: OnlinePayment,
    callbacks?: OnlinePaymentCallbacks,
    options?: { statusCheck?: PaymentStatusCheckConfig },
): void {
    const payload = (payment.payload ?? {}) as PaymentInstructionPayload;

    if (
        payment.provider === 'midtrans' &&
        typeof payload.snap_token === 'string' &&
        payload.snap_token.trim() !== ''
    ) {
        openMidtransSnapPayment(payment, callbacks, options);

        return;
    }

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
