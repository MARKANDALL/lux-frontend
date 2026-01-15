import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  base: "./",

  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: true,
    emptyOutDir: true,

    // ✅ IMPORTANT: build all your separate HTML pages
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        convo: resolve(__dirname, "convo.html"),
        progress: resolve(__dirname, "progress.html"),

        adminIndex: resolve(__dirname, "admin/index.html"),
        adminOverview: resolve(__dirname, "admin/overview.html"),
        adminUser: resolve(__dirname, "admin/user.html"),
      },
    },
  },

  server: {
    port: 3000,
    open: true,

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
