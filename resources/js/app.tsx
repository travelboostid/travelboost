import { createInertiaApp, router } from '@inertiajs/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { ThemeProvider } from 'next-themes';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../css/app.css';
import { DeferredAppServices } from './components/deferred-app-services';
import I18nProvider from './components/i18n-provider';
import { LocaleProvider } from './components/locale-context';
import { Toaster } from './components/ui/sonner';
import { TooltipProvider } from './components/ui/tooltip';
import { initializeTheme } from './hooks/use-appearance';
import { configureEchoIfNeeded } from './lib/configure-echo';
import { NuqsAdapter } from './lib/nuqs-inertia-adapter';

dayjs.extend(relativeTime);

configureEchoIfNeeded();

router.on('start', (event) => {
    configureEchoIfNeeded(
        new URL(event.detail.visit.url, window.location.origin).pathname,
    );
});

router.on('navigate', (event) => {
    window.gtag?.('event', 'page_view', {
        page_title: document.title,
        page_location: window.location.href,
        page_path: event.detail.page.url,
    });
});

const queryClient = new QueryClient();
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

        const isOnDesignerPage =
            window.location.pathname.match(/^\/([^/]+)\/design/);

        root.render(
            <StrictMode>
                <LocaleProvider>
                    <I18nProvider>
                        <ThemeProvider
                            attribute="class"
                            defaultTheme="light"
                            forcedTheme={isOnDesignerPage ? 'light' : undefined}
                            enableSystem
                            disableTransitionOnChange
                        >
                            <TooltipProvider>
                                <QueryClientProvider client={queryClient}>
                                    <NuqsAdapter>
                                        <App {...props} />
                                    </NuqsAdapter>
                                    <DeferredAppServices />
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

initializeTheme();
