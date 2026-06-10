type OnlinePayment = {
    provider?: string;
    payload?: Record<string, unknown> | null;
};

type OnlinePaymentCallbacks = {
    onComplete?: () => void;
};

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

            if (parsed.hostname.includes('plink.co.id')) {
                return url;
            }

            if (
                parsed.pathname.includes('/paymentpage/') ||
                parsed.pathname.includes('/directdebit/')
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

export function openOnlinePayment(
    payment: OnlinePayment,
    callbacks?: OnlinePaymentCallbacks,
): void {
    const reload = () => {
        if (callbacks?.onComplete) {
            callbacks.onComplete();
            return;
        }

        window.location.reload();
    };

    if (payment.provider === 'prismalink') {
        const rawUrl = payment.payload?.payment_page_url as string | undefined;

        if (rawUrl) {
            window.location.href = resolvePrismaLinkPaymentPageUrl(rawUrl);
        }

        return;
    }

    const snapToken = payment.payload?.snap_token as string | undefined;
    const snap = (
        window as { snap?: { pay: (token: string, options: object) => void } }
    ).snap;

    if (!snapToken || typeof snap?.pay !== 'function') {
        return;
    }

    snap.pay(snapToken, {
        onSuccess: reload,
        onError: reload,
        onClose: reload,
    });
}
