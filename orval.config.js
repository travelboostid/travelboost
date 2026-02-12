import { defineConfig } from 'orval';

export default defineConfig({
  traveboostQuery: {
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
      target: 'http://localhost:8000/docs/api.json',
    },
  },
});
