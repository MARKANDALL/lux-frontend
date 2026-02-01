// vite.config.js
import { defineConfig } from "vite";
import { resolve } from "path";

function getAdminToken() {
  return process.env.LUX_ADMIN_TOKEN || process.env.ADMIN_TOKEN || "";
}

const API_TARGET =
  process.env.LUX_API_TARGET || "https://luxury-language-api.vercel.app";

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
      // Proxy /api/* to backend, but avoid accidentally proxying JS assets.
      "^/api/(?!.*\\.js(?:\\?.*)?$)": {
        target: `${API_TARGET}/api`,
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/api/, ""),
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
