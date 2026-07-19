/**
 * Live-network e2e config. These suites hit DEPLOYED production endpoints and
 * are deliberately kept out of `npm test`, which must stay hermetic so a CI
 * gate can depend on it. Run explicitly: `npm run test:e2e`.
 */
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/test/mcp/**/*.{test,spec}.{ts,tsx}'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
