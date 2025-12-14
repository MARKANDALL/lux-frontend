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
    port: 3000, 
    open: true,
    
    // THE FIX:
    // We use a "Negative Lookahead" Regex.
    // It says: Match "/api/...", BUT NOT if it ends in ".js"
    // This lets your code files load locally, while API data calls go to the cloud.
    proxy: {
      '^/api/(?!.*\\.js$)': {
        target: 'https://luxury-language-api.vercel.app',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});