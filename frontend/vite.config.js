import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  css: {
    preprocessorOptions: {
      // Optional: Add if you're using custom Tailwind theming via SCSS or PostCSS
    },
  },
  server: {
    port: 5173,
  },
  build: {
    outDir: 'dist',
  },
});
