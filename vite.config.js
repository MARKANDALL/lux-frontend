import { defineConfig } from "vite";
import { resolve } from "path";

const API_ORIGIN =
  process.env.LUX_API_ORIGIN ||
  process.env.VITE_LUX_API_ORIGIN ||
  "https://luxury-language-api.vercel.app";

function getAdminToken() {
  return process.env.LUX_ADMIN_TOKEN || process.env.ADMIN_TOKEN || "";
}

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
        streamSetup: resolve(__dirname, "stream-setup.html"),
        life: resolve(__dirname, "life.html"),

        // Admin pages
        adminIndex: resolve(__dirname, "admin/index.html"),
        adminOverview: resolve(__dirname, "admin/overview.html"),
        adminUser: resolve(__dirname, "admin/user.html"),
      },
    },
  },

  server: {
    port: 3000,
    strictPort: false,
    open: true,

    proxy: {
      "/api": {
        target: API_ORIGIN,
        changeOrigin: true,
        secure: true,
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            const t = getAdminToken();
            if (t) proxyReq.setHeader("x-admin-token", t);
          });
        },
      },
    },
  },
});
