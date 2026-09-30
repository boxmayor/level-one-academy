import { configDefaults, defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: { chunkSizeWarningLimit: 900 },
  test: {
    // src/dev holds slow design tools (puzzle solver surveys). Run them with: DESIGN=1 npx vitest run src/dev
    exclude: process.env.DESIGN ? configDefaults.exclude : [...configDefaults.exclude, 'src/dev/**'],
  },
});
