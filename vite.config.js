// vite.config.js
import { defineConfig } from "vite";
import { resolve } from "path";

function pickApiTarget() {
  // Allows easy swap between prod + local backend without editing this file.
  // Examples:
  //   VITE_API_TARGET="http://localhost:3003" npm run dev
  //   (defaults to Vercel)
  return (
    process.env.VITE_API_TARGET ||
    "https://luxury-language-api.vercel.app"
  );
}

function pickAdminToken() {
  return process.env.LUX_ADMIN_TOKEN || process.env.ADMIN_TOKEN || "";
}

export default defineConfig(() => {
  const apiTarget = pickApiTarget();
  const token = pickAdminToken();

  return {
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

          // Streaming + Life
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
        // Proxy any /api/* EXCEPT requests that look like JS files.
        "^/api/(?!.*\\.js(?:\\?.*)?$)": {
          target: `${apiTarget}/api`,
          changeOrigin: true,
          secure: true,
          rewrite: (p) => p.replace(/^\/api/, ""),
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              if (token) proxyReq.setHeader("x-admin-token", token);
            });
          },
        },
      },
    },
  };
});
