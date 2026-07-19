import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    // Live-network e2e suites are excluded from the default run. They POST to
    // the deployed production Edge Functions, so they are non-hermetic and fail
    // closed in any runner without egress. Run deliberately: `npm run test:e2e`.
    exclude: ['node_modules/**', 'dist/**', 'src/test/mcp/**'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
