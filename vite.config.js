// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  // Base path
  base: './', 
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    open: true,
    // THE PROXY: This fixes the CORS / "Empty Dashboard" issue
    proxy: {
      '/api': {
        target: 'https://luxury-language-api.vercel.app',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});