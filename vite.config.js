import { defineConfig } from "vite";

export default defineConfig({
  base: "./",

  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: true,
    emptyOutDir: true,
  },

  server: {
    port: 3000,
    open: true,

    // Proxy API *data* calls to the cloud,
    // but do NOT proxy local JS modules like /api/*.js (even with ?t=... cache busters)
    proxy: {
      "^/api/(?!.*\\.js(?:\\?.*)?$)": {
        target: "https://luxury-language-api.vercel.app",
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/api/, ""),
      },
    },
  },
});
 