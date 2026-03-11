export const TEST_CATEGORIES = ['Frontend', 'Backend', 'Integration', 'Compatibility', 'Performance', 'WebUI', 'MCP'] as const;
export type TestCategory = (typeof TEST_CATEGORIES)[number];

export const TEST_STATUSES = ['pass', 'fail', 'blocked', 'skipped'] as const;
export type TestStatus = (typeof TEST_STATUSES)[number];

export const SUPPORTED_FRONTEND_FRAMEWORKS = [
  'react',
  'next',
  'vue',
  'nuxt',
  'svelte',
  'sveltekit',
  'angular',
] as const;

export const SUPPORTED_BACKEND_FRAMEWORKS = [
  'express',
  'fastify',
  'nestjs',
  'koa',
  'hapi',
] as const;

export const SUPPORTED_TEST_RUNNERS = ['vitest', 'jest', 'mocha'] as const;

export const DEFAULT_EXCLUDE = [
  'node_modules',
  'dist',
  'build',
  '.git',
  'coverage',
  '.next',
  '.nuxt',
  '.svelte-kit',
  '__pycache__',
];

export const FILE_TYPE_MAP: Record<string, string[]> = {
  component: ['.tsx', '.jsx', '.vue', '.svelte'],
  style: ['.css', '.scss', '.less', '.sass'],
  config: ['.json', '.yaml', '.yml', '.toml', '.env'],
  test: ['.test.ts', '.test.tsx', '.test.js', '.spec.ts', '.spec.tsx', '.spec.js'],
};
