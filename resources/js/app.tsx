import { createInertiaApp, router } from '@inertiajs/react';
import { configureEcho } from '@laravel/echo-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { ThemeProvider } from 'next-themes';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../css/app.css';
import I18nProvider from './components/i18n-provider';
import { LocaleProvider } from './components/locale-context';
import { OnlinePaymentHost } from './components/payment/online-payment-host';
import { Toaster } from './components/ui/sonner';
import { TooltipProvider } from './components/ui/tooltip';
import { initializeTheme } from './hooks/use-appearance';
import { NuqsAdapter } from './lib/nuqs-inertia-adapter';
dayjs.extend(relativeTime);

router.on('navigate', (event) => {
    window.gtag?.('event', 'page_view', {
        page_title: document.title,
        page_location: window.location.href,
        page_path: event.detail.page.url,
    });

    window.fbq?.('track', 'PageView');
});

const queryClient = new QueryClient();

configureEcho({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
    wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
    enabledTransports: ['ws', 'wss'],
});

console.log(
    'Echo configured with Reverb host:',
    import.meta.env.VITE_REVERB_HOST,
);

const appName = import.meta.env.VITE_APP_NAME || 'Travelboost';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        // work around. need more proper solution
        const isOnDesignerPage =
            window.location.pathname.match(/^\/([^/]+)\/design/);

        root.render(
            <StrictMode>
                <LocaleProvider>
                    <I18nProvider>
                        <ThemeProvider
                            attribute="class"
                            defaultTheme="light"
                            forcedTheme={isOnDesignerPage ? 'light' : undefined} // design page must light theme!
                            enableSystem
                            disableTransitionOnChange
                        >
                            <TooltipProvider>
                                <QueryClientProvider client={queryClient}>
                                    <NuqsAdapter>
                                        <App {...props} />
                                    </NuqsAdapter>
                                    <OnlinePaymentHost />
                                    <Toaster />
                                </QueryClientProvider>
                            </TooltipProvider>
                        </ThemeProvider>
                    </I18nProvider>
                </LocaleProvider>
            </StrictMode>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
