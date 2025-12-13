import { defineConfig } from 'vite';

export default defineConfig({
  // Base path for relative links
  base: './', 

  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    emptyOutDir: true,
  },

  server: {
    // Sets the default port. If 3000 is busy, Vite will auto-try 3001.
    port: 3000, 
    open: true,
    
    // THE PROXY FIX:
    // This tells Vite: "If a request starts with /api...
    // ...BUT it does NOT end in .js, send it to the backend."
    proxy: {
      '^/api/(?!.*\\.js$)': {
        target: 'https://luxury-language-api.vercel.app',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});