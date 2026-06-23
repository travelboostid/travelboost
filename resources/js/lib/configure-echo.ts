import { isEchoDeferredPath } from '@/lib/echo-paths';
import { isMarketingPath } from '@/lib/marketing-pages';
import { configureEcho } from '@laravel/echo-react';

let echoConfigured = false;

export function configureEchoNow(): void {
    if (echoConfigured) {
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

export function configureEchoIfNeeded(
    pathname: string = window.location.pathname,
): void {
    if (
        echoConfigured ||
        isMarketingPath(pathname) ||
        isEchoDeferredPath(pathname)
    ) {
        return;
    }

    configureEchoNow();
}
