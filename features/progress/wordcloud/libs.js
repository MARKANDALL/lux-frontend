// features/progress/wordcloud/libs.js
// Loads vendor scripts ONLY when this page opens.

function ensureScript(src, id) {
  return new Promise((resolve) => {
    if (document.getElementById(id)) return resolve(true);

    const s = document.createElement("script");
    s.id = id;
    s.src = src;
    s.async = true;

    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);

    document.head.appendChild(s);
  });
}

/**
 * EXPECTED vendor files (you add them):
 * - /public/vendor/d3.v7.min.js
 * - /public/vendor/d3.layout.cloud.js
 */
export async function ensureWordCloudLibs() {
  const ok1 = await ensureScript("/vendor/d3.v7.min.js", "lux-d3");
  const ok2 = await ensureScript("/vendor/d3.layout.cloud.js", "lux-d3-cloud");

  // d3 must exist, cloud must exist
  const d3Ok = !!window.d3;
  const cloudOk = !!(window.d3?.layout?.cloud || window.cloud);

  return ok1 && ok2 && d3Ok && cloudOk;
}
