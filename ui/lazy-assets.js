// src/ui/lazy-assets.js

export function ensureCSS(href) {
  const exists = [...document.styleSheets].some((s) => (s.href || "").includes(href));
  if (exists) return;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

export async function ensureScript(src) {
  const exists = [...document.scripts].some((s) => (s.src || "").includes(src));
  if (exists) return;

  await new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}
