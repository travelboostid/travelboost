import { isEchoDeferredPath } from '@/lib/echo-paths';
import { isMarketingPath } from '@/lib/marketing-pages';
import { configureEcho } from '@laravel/echo-react';

let echoConfigured = false;

type EchoPusher = {
    connection: {
        bind: (event: string, callback: () => void) => void;
    };
    disconnect: () => void;
};

function isReverbConfigured(): boolean {
    return (
        import.meta.env.VITE_BROADCAST_CONNECTION === 'reverb' &&
        Boolean(import.meta.env.VITE_REVERB_APP_KEY?.trim()) &&
        Boolean(import.meta.env.VITE_REVERB_HOST?.trim())
    );
}

function silencePusherConsole(): void {
    const pusherConstructor = (
        window as Window & {
            Pusher?: { logToConsole?: boolean };
        }
    ).Pusher;

    if (pusherConstructor) {
        pusherConstructor.logToConsole = false;
    }
}

function attachQuietConnectionGuards(): void {
    const pusher = (
        window as Window & {
            Echo?: {
                connector?: {
                    pusher?: EchoPusher;
                };
            };
        }
    ).Echo?.connector?.pusher;

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

    configureEcho({
        broadcaster: 'reverb',
        key: import.meta.env.VITE_REVERB_APP_KEY,
        wsHost: import.meta.env.VITE_REVERB_HOST,
        wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
        wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
        forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
        enabledTransports: ['ws', 'wss'],
    });

    silencePusherConsole();
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
