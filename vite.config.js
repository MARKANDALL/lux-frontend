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
    // THE PROXY FIX:
    // We use a Regex to match "/api" ONLY if it does NOT end in ".js"
    // This allows local source files (api/identity.js) to load, 
    // while API calls (api/assess) go to the server.
    proxy: {
      '^/api/(?!.*\\.js$)': {
        target: 'https://luxury-language-api.vercel.app',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});