import { isMarketingPath } from '@/lib/marketing-pages';
import { router } from '@inertiajs/react';
import { configureEcho } from '@laravel/echo-react';
import { lazy, Suspense, useEffect, useState } from 'react';

const OnlinePaymentHost = lazy(() =>
    import('@/components/payment/online-payment-host').then((module) => ({
        default: module.OnlinePaymentHost,
    })),
);

let echoConfigured = false;

function ensureEchoConfigured(): void {
    if (echoConfigured || isMarketingPath()) {
        return;
    }

    configureEcho({
        broadcaster: 'reverb',
        key: import.meta.env.VITE_REVERB_APP_KEY,
        wsHost: import.meta.env.VITE_REVERB_HOST,
        wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
        wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
        forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
        enabledTransports: ['ws', 'wss'],
    });

    echoConfigured = true;
}

function resolvePathname(url: string): string {
    return new URL(url, window.location.origin).pathname;
}

export function DeferredAppServices() {
    const [marketing, setMarketing] = useState(() => isMarketingPath());

    useEffect(() => {
        ensureEchoConfigured();

        return router.on('navigate', (event) => {
            const nextMarketing = isMarketingPath(
                resolvePathname(event.detail.page.url),
            );

            setMarketing(nextMarketing);
            ensureEchoConfigured();
        });
    }, []);

    if (marketing) {
        return null;
    }

    return (
        <Suspense fallback={null}>
            <OnlinePaymentHost />
        </Suspense>
    );
}
