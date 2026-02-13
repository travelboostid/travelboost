import { createInertiaApp } from '@inertiajs/react';
import { configureEcho } from '@laravel/echo-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { ThemeProvider } from 'next-themes';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../css/app.css';
import { Toaster } from './components/ui/sonner';
import { initializeTheme } from './hooks/use-appearance';

const queryClient = new QueryClient();

const ECHO_CONFIGS = {
  pusher: {
    broadcaster: 'pusher',
    key: import.meta.env.VITE_PUSHER_APP_KEY,
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
    forceTLS: true,
    encrypted: true,
  },
  ably: {
    broadcaster: 'ably',
    key: import.meta.env.VITE_ABLY_PUBLIC_KEY,
    forceTLS: true,
    enabledTransports: ['ws', 'wss'],
    authEndpoint: '/broadcasting/auth',
    echoMessages: true, // self-echo for published message is set to false internally.
    queueMessages: true, // default: true, maintains queue for messages to be sent.
    disconnectedRetryTimeout: 15000, // reconnect after 15 seconds when client goes disconnected state
    suspendedRetryTimeout: 30000, // reconnect after 30 seconds when client goes suspended state
  },
  reverb: {
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT,
    wssPort: import.meta.env.VITE_REVERB_PORT,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
    enabledTransports: ['ws', 'wss'],
  },
};

const selectedConfig =
  ECHO_CONFIGS[
    (import.meta.env.VITE_BROADCAST_CONNECTION as
      | 'pusher'
      | 'ably'
      | 'reverb') || 'pusher'
  ];

console.log('Selected Echo Config:', selectedConfig);

configureEcho(selectedConfig as any);
const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
  title: (title) => (title ? `${title} - ${appName}` : appName),
  resolve: (name) =>
    resolvePageComponent(
      `./pages/${name}.tsx`,
      import.meta.glob('./pages/**/*.tsx'),
    ),
  setup({ el, App, props }) {
    const root = createRoot(el);

    root.render(
      <StrictMode>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <QueryClientProvider client={queryClient}>
            <App {...props} />
            <Toaster />
          </QueryClientProvider>
        </ThemeProvider>
      </StrictMode>,
    );
  },
  progress: {
    color: '#4B5563',
  },
});

// This will set light / dark mode on load...
initializeTheme();
