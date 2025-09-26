import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['spec/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.git', '.cache'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test-runner.ts',
        'src/integration-tests.ts',
        'coverage/',
        '**/*.d.ts'
      ]
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});
