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

export type MidtransPublicConfig = {
    clientKey: string;
    isProduction: boolean;
};

let runtimeConfig: MidtransPublicConfig | null = null;
let scriptPromise: Promise<void> | null = null;

export function setMidtransPublicConfig(
    config: MidtransPublicConfig | null | undefined,
): void {
    if (!config?.clientKey?.trim()) {
        runtimeConfig = null;

        return;
    }

    runtimeConfig = {
        clientKey: config.clientKey.trim(),
        isProduction: config.isProduction,
    };
}

function resolveMidtransClientKey(): string {
    const clientKey =
        runtimeConfig?.clientKey ||
        (
            import.meta.env.VITE_MIDTRANS_CLIENT_KEY as string | undefined
        )?.trim();

    if (!clientKey || clientKey === '') {
        throw new Error('Midtrans client key is not configured.');
    }

    if (clientKey.includes('${')) {
        throw new Error(
            'Midtrans client key was not resolved from environment variables.',
        );
    }

    return clientKey;
}

function resolveSnapScriptUrl(): string {
    const isProduction =
        runtimeConfig?.isProduction ??
        import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === 'true';

    return isProduction ? SNAP_SCRIPT_PRODUCTION : SNAP_SCRIPT_SANDBOX;
}

function snapIsReady(): boolean {
    if (typeof window === 'undefined') {
        return false;
    }

    return Boolean((window as MidtransSnapWindow).snap?.pay);
}

function resetScriptPromise(): void {
    scriptPromise = null;
}

function waitForSnapInitialization(
    script: HTMLScriptElement,
    resolve: () => void,
    reject: (error: Error) => void,
): void {
    if (snapIsReady()) {
        resolve();

        return;
    }

    const maxWaitMs = 15_000;
    const pollMs = 50;
    const startedAt = Date.now();
    let settled = false;

    const finish = (outcome: 'resolve' | 'reject', error?: Error) => {
        if (settled) {
            return;
        }

        settled = true;
        window.clearInterval(pollTimer);

        if (outcome === 'resolve') {
            resolve();

            return;
        }

        resetScriptPromise();
        reject(error ?? new Error('Failed to load Midtrans Snap.'));
    };

    const pollTimer = window.setInterval(() => {
        if (snapIsReady()) {
            finish('resolve');

            return;
        }

        if (Date.now() - startedAt >= maxWaitMs) {
            finish(
                'reject',
                new Error(
                    'Midtrans Snap failed to initialize. Check the client key and environment.',
                ),
            );
        }
    }, pollMs);

    script.addEventListener(
        'load',
        () => {
            if (snapIsReady()) {
                finish('resolve');
            }
        },
        { once: true },
    );
    script.addEventListener(
        'error',
        () => {
            finish('reject', new Error('Failed to load Midtrans Snap.'));
        },
        { once: true },
    );
}

export function loadMidtransSnapScript(): Promise<void> {
    if (typeof window === 'undefined') {
        return Promise.reject(
            new Error('Midtrans Snap is only available in the browser.'),
        );
    }

    if (snapIsReady()) {
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
            waitForSnapInitialization(existingScript, resolve, reject);

            return;
        }

        let clientKey: string;

        try {
            clientKey = resolveMidtransClientKey();
        } catch (error) {
            resetScriptPromise();
            reject(error);

            return;
        }

        const script = document.createElement('script');
        script.src = resolveSnapScriptUrl();
        script.setAttribute('data-client-key', clientKey);
        script.setAttribute('data-midtrans-snap', 'true');
        script.async = true;
        script.onload = () => {
            if (snapIsReady()) {
                resolve();

                return;
            }

            resetScriptPromise();
            reject(
                new Error(
                    'Midtrans Snap failed to initialize. Check the client key and environment.',
                ),
            );
        };
        script.onerror = () => {
            resetScriptPromise();
            reject(new Error('Failed to load Midtrans Snap.'));
        };
        document.head.appendChild(script);
    });

    return scriptPromise.catch((error) => {
        resetScriptPromise();

        throw error;
    });
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
