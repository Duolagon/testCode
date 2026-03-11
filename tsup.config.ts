import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: { 'bin/cli': 'src/bin/cli.ts' },
    format: ['esm'],
    outExtension: () => ({ js: '.mjs' }),
    external: ['esbuild'],
    sourcemap: true,
    target: 'node20',
    clean: true,
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
  {
    entry: { index: 'src/index.ts' },
    format: ['esm'],
    outExtension: () => ({ js: '.mjs' }),
    external: ['esbuild'],
    dts: true,
    sourcemap: true,
    target: 'node20',
  },
]);
