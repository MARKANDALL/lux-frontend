// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  // Base path (keeps paths relative so they work on Vercel/Netlify)
  base: './', 
  build: {
    outDir: 'dist',    // Production build goes here
    assetsDir: 'assets',
    sourcemap: true,   // Helps debugging in production
    emptyOutDir: true, // Cleans the dist folder before building
  },
  server: {
    port: 3000,        // Keeps your familiar port
    open: true,        // Opens browser automatically
  }
});