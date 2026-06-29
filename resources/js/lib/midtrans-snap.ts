const SNAP_SCRIPT_SANDBOX = 'https://app.sandbox.midtrans.com/snap/snap.js';
const SNAP_SCRIPT_PRODUCTION = 'https://app.midtrans.com/snap/snap.js';

type MidtransSnapCallbacks = {
    onSuccess?: () => void;
    onPending?: () => void;
    onError?: () => void;
    onClose?: () => void;
};

type MidtransSnapWindow = Window & {
    snap?: {
        pay: (token: string, options: MidtransSnapCallbacks) => void;
    };
};

let scriptPromise: Promise<void> | null = null;

function resolveMidtransClientKey(): string {
    const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY as
        | string
        | undefined;

    if (!clientKey || clientKey.trim() === '') {
        throw new Error('Midtrans client key is not configured.');
    }

    return clientKey.trim();
}

function resolveSnapScriptUrl(): string {
    return import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === 'true'
        ? SNAP_SCRIPT_PRODUCTION
        : SNAP_SCRIPT_SANDBOX;
}

export function loadMidtransSnapScript(): Promise<void> {
    if (typeof window === 'undefined') {
        return Promise.reject(
            new Error('Midtrans Snap is only available in the browser.'),
        );
    }

    const snapWindow = window as MidtransSnapWindow;

    if (snapWindow.snap?.pay) {
        return Promise.resolve();
    }

    if (scriptPromise) {
        return scriptPromise;
    }

    scriptPromise = new Promise((resolve, reject) => {
        const existingScript = document.querySelector<HTMLScriptElement>(
            'script[data-midtrans-snap="true"]',
        );

        if (existingScript) {
            existingScript.addEventListener('load', () => resolve(), {
                once: true,
            });
            existingScript.addEventListener(
                'error',
                () => reject(new Error('Failed to load Midtrans Snap.')),
                { once: true },
            );

            return;
        }

        const script = document.createElement('script');
        script.src = resolveSnapScriptUrl();
        script.setAttribute('data-client-key', resolveMidtransClientKey());
        script.setAttribute('data-midtrans-snap', 'true');
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () =>
            reject(new Error('Failed to load Midtrans Snap.'));
        document.head.appendChild(script);
    });

    return scriptPromise;
}

export function openMidtransSnap(
    token: string,
    callbacks: MidtransSnapCallbacks = {},
): void {
    const snapWindow = window as MidtransSnapWindow;

    if (!snapWindow.snap?.pay) {
        callbacks.onError?.();
        return;
    }

    snapWindow.snap.pay(token, {
        onSuccess: () => callbacks.onSuccess?.(),
        onPending: () => callbacks.onPending?.(),
        onError: () => callbacks.onError?.(),
        onClose: () => callbacks.onClose?.(),
    });
}
