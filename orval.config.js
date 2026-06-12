import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import { defineConfig } from 'orval';
import process from 'process';

const env = dotenv.config();
dotenvExpand.expand(env);

const {
    VITE_APP_HOST: appHost,
    VITE_APP_PORT: appPort,
    VITE_APP_SCHEME: appScheme,
} = process.env;
const baseUrl = `${appScheme}://${appHost}${appPort ? `:${appPort}` : ''}`;

/**
 * Orval generates React Query hooks + TypeScript models from Scramble OpenAPI.
 *
 * Scramble (`config/scramble.php`) only exports routes under `/webapi`.
 * Axios uses `baseURL: '/webapi'`, so OpenAPI paths are relative (e.g. `/medias`).
 *
 * After backend API changes: `pnpm orval`
 */
export default defineConfig({
    travelboost: {
        output: {
            mode: 'tags-split',
            target: 'resources/js/api/traveboost.ts',
            schemas: 'resources/js/api/model',
            client: 'react-query',
            override: {
                mutator: {
                    path: './resources/js/api/api-instance.ts',
                    name: 'apiInstance',
                },
            },
        },
        input: {
            target: `${baseUrl}/docs/api.json`,
        },
    },
});
