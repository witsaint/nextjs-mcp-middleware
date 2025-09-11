import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'dist/',
        'test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        '**/build/**',
        '**/.next/**',
        '**/public/**',
        '**/docs/**',
        '**/README*',
        '**/CHANGELOG*',
        '**/LICENSE*',
        '**/pnpm-lock.yaml',
        '**/pnpm-workspace.yaml',
      ],
      include: [
        'src/**/*.{ts,tsx}',
      ],
      thresholds: {
        'global': {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        // Per-file thresholds for critical files
        'src/middles/index.ts': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90,
        },
        'src/middles/api/mcp.ts': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
        'src/middles/api/auth-register.ts': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
        'src/middles/api/auth-authorize.ts': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
        'src/middles/api/auth-token.ts': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
        'src/middles/cors.ts': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
