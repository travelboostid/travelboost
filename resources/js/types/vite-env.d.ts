/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_APP_NAME: string;
    readonly VITE_APP_HOST: string;
    readonly VITE_APP_PORT: string;
    readonly VITE_APP_SCHEME: string;
    readonly VITE_APP_URL: string;
    readonly VITE_APP_IP_HOST: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
