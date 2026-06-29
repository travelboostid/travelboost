import { isEchoDeferredPath } from '@/lib/echo-paths';
import { isMarketingPath } from '@/lib/marketing-pages';
import { configureEcho } from '@laravel/echo-react';
import Pusher from 'pusher-js';

let echoConfigured = false;

function isReverbConfigured(): boolean {
    return (
        import.meta.env.VITE_BROADCAST_CONNECTION === 'reverb' &&
        Boolean(import.meta.env.VITE_REVERB_APP_KEY?.trim()) &&
        Boolean(import.meta.env.VITE_REVERB_HOST?.trim())
    );
}

function attachQuietConnectionGuards(): void {
    const echoInstance = (
        window as Window & {
            Echo?: {
                connector?: {
                    pusher?: Pusher;
                };
            };
        }
    ).Echo;

    const pusher = echoInstance?.connector?.pusher;

    if (!pusher) {
        return;
    }

    let failureCount = 0;

    pusher.connection.bind('error', () => {
        failureCount += 1;

        if (failureCount >= 2) {
            pusher.disconnect();
        }
    });

    pusher.connection.bind('unavailable', () => {
        pusher.disconnect();
    });
}

export function configureEchoNow(): void {
    if (echoConfigured || !isReverbConfigured()) {
        return;
    }

    Pusher.logToConsole = false;

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

    window.setTimeout(() => {
        attachQuietConnectionGuards();
    }, 0);
}

export function configureEchoIfNeeded(
    pathname: string = window.location.pathname,
): void {
    if (
        echoConfigured ||
        !isReverbConfigured() ||
        isMarketingPath(pathname) ||
        isEchoDeferredPath(pathname)
    ) {
        return;
    }

    configureEchoNow();
}
