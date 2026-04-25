import formatjs from '@formatjs/unplugin/vite';
import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    laravel({
      input: ['resources/css/app.css', 'resources/js/app.tsx'],
      ssr: 'resources/js/ssr.tsx',
      refresh: true,
    }),
    react({
      babel: {},
    }),
    formatjs({
      idInterpolationPattern: '[sha512:contenthash:base64:6]',
      ast: true,
    }),
    tailwindcss(),
    wayfinder({
      formVariants: true,
    }),
  ],
  esbuild: {
    jsx: 'automatic',
  },
  server: {
    cors: {
      origin: '*',
      credentials: true,
    },
    hmr: {
      host: 'localhost',
      port: 5174,
      overlay: true,
    },
  },
});
