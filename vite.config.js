// vite.config.js
import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  base: "./",

  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: true,
    emptyOutDir: true,

    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        convo: resolve(__dirname, "convo.html"),
        progress: resolve(__dirname, "progress.html"),
        wordcloud: resolve(__dirname, "wordcloud.html"),
        stream: resolve(__dirname, "stream.html"),

        // Admin pages
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
