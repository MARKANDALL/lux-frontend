// vite.config.js
// Vite config for Lux frontend: multi-page build inputs + dev server proxy to API (with optional admin token + clearer proxy failures).

import { defineConfig, loadEnv } from "vite";
import { resolve } from "path";

export default defineConfig(({ mode }) => {
  // Load env from .env, .env.local, .env.[mode], etc.
  const env = loadEnv(mode, process.cwd(), "");

  const API_ORIGIN =
    env.LUX_API_ORIGIN ||
    env.VITE_LUX_API_ORIGIN ||
    "https://luxury-language-api.vercel.app";

  console.log("[vite] API_ORIGIN =", API_ORIGIN);

  // Only used for dev proxy header injection (optional)
  const ADMIN_TOKEN =
    env.VITE_ADMIN_TOKEN ||
    env.VITE_LUX_ADMIN_TOKEN ||
    env.LUX_ADMIN_TOKEN ||
    env.ADMIN_TOKEN ||
    "";

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
      // Prefer 3000, but allow Vite to auto-pick 3001/3002/etc if taken.
      port: 3000,
      strictPort: false, // ✅ Option A: do NOT fail just because 3000 is occupied

      open: true,

      proxy: {
        "/api": {
          target: API_ORIGIN,
          changeOrigin: true,
          secure: true,

          // ✅ Do NOT proxy module/static asset requests under /api (those are frontend files)
          bypass: (req) => {
            const url = req.url || "";
            if (
              url.endsWith(".js") ||
              url.endsWith(".css") ||
              url.endsWith(".map") ||
              url.endsWith(".ico") ||
              url.endsWith(".png") ||
              url.endsWith(".jpg") ||
              url.endsWith(".jpeg") ||
              url.endsWith(".svg") ||
              url.endsWith(".webp")
            ) {
              return url; // let Vite serve it locally
            }
          },

          // Add admin token header (if set). Safe no-op if empty.
          configure: (proxy) => {
            // Log proxy errors clearly (port drift / backend down / wrong origin)
            proxy.on("error", (err, req, res) => {
              const code = err?.code || err?.message || String(err);
              console.error(
                `[vite][proxy error] ${req?.method} ${req?.url} -> ${API_ORIGIN} :: ${code}`
              );

              // Return a readable response instead of an opaque 500 page
              try {
                if (res && !res.headersSent) {
                  res.writeHead(502, { "Content-Type": "text/plain" });
                }
                if (res && !res.writableEnded) {
                  res.end(
                    `Proxy error: ${code}\nTarget: ${API_ORIGIN}\n` +
                      `Tip: confirm backend is running on Target port.\n`
                  );
                }
              } catch (_) {}
            });

            // Optional: log non-2xx from target (helps distinguish target 401/500 vs proxy failure)
            proxy.on("proxyRes", (proxyRes, req) => {
              const sc = proxyRes?.statusCode || 0;
              if (sc >= 400) {
                console.warn(
                  `[vite][proxy] ${req?.method} ${req?.url} -> ${API_ORIGIN} (${sc})`
                );
              }
            });

            proxy.on("proxyReq", (proxyReq) => {
              if (ADMIN_TOKEN) proxyReq.setHeader("x-admin-token", ADMIN_TOKEN);
            });
          },
        },
      },
    },
  };
});
