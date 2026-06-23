import { isMarketingPath } from '@/lib/marketing-pages';
import { router } from '@inertiajs/react';
import { lazy, Suspense, useEffect, useState } from 'react';

const OnlinePaymentHost = lazy(() =>
    import('@/components/payment/online-payment-host').then((module) => ({
        default: module.OnlinePaymentHost,
    })),
);

function resolvePathname(url: string): string {
    return new URL(url, window.location.origin).pathname;
}

export function DeferredAppServices() {
    const [marketing, setMarketing] = useState(() => isMarketingPath());

    useEffect(() => {
        return router.on('navigate', (event) => {
            setMarketing(
                isMarketingPath(resolvePathname(event.detail.page.url)),
            );
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
