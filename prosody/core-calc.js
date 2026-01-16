// prosody/core-calc.js
// Timestamp parsing + timing/stat helpers (ES Module)

function toSec(v) {
  if (v == null) return null;
  if (typeof v === "number" && Number.isFinite(v)) {
    if (v >= 5e6) return v / 1e7;
    if (v >= 1000 && v < 5e6) return v / 1000;
    return v;
  }
  if (typeof v === "string") {
    var s = v.trim();
    if (!s) return null;
    if (/^-?\d+(\.\d+)?$/.test(s)) return toSec(+s);
    var suf = s.match(/^(-?\d+(?:\.\d+)?)(ms|msec|s|sec|secs|seconds)$/i);
    if (suf) {
      var n = parseFloat(suf[1]);
      var u = suf[2].toLowerCase();
      return u === "ms" || u === "msec" ? n / 1000 : n;
    }
    var hms = s.match(/^(\d{1,2}):([0-5]?\d):([0-5]?\d)(?:\.(\d{1,9}))?$/);
    if (hms) {
      var h = +hms[1],
        m = +hms[2],
        sec = +hms[3],
        frac = hms[4] ? parseFloat("0." + hms[4]) : 0;
      return h * 3600 + m * 60 + sec + frac;
    }
    var iso = s.match(
      /^P(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)$/i
    );
    if (iso) {
      var ih = parseFloat(iso[1] || "0"),
        im = parseFloat(iso[2] || "0"),
        is = parseFloat(iso[3] || "0");
      return ih * 3600 + im * 60 + is;
    }
    return null;
  }
  if (typeof v === "object") {
    if ("seconds" in v) return toSec(v.seconds);
    if ("ms" in v) return toSec(v.ms);
    if ("ticks" in v) return v.ticks / 1e7;
    if ("Offset" in v || "offset" in v) return toSec(v.Offset ?? v.offset);
    if ("Duration" in v || "duration" in v)
      return toSec(v.Duration ?? v.duration);
  }
  return null;
}

export function ticksToSec(v) {
  return toSec(v);
}

export function median(nums) {
  var a = (nums || [])
    .filter(Number.isFinite)
    .slice()
    .sort(function (x, y) {
      return x - y;
    });
  if (!a.length) return null;
  var mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}

export function computeTimings(words = []) {
  const out = [];

  for (const w of words || []) {
    if (!w) continue;

    let start = null;
    let end = null;
    let dur = null;

    // ✅ Azure Pronunciation Assessment word timings are ALWAYS 100ns ticks.
    // This avoids the "2902s / 0 wpm" bug caused by misclassifying values as ms.
    const ticksToSec = (v) =>
      v == null || !Number.isFinite(+v) ? null : +v / 1e7;

    if (w.Offset != null) start = ticksToSec(w.Offset);
    if (w.Duration != null) dur = ticksToSec(w.Duration);
    if (w.Offset != null && w.Duration != null)
      end = ticksToSec(+w.Offset + +w.Duration);

    // Fallbacks for other shapes
    if (w.Start != null) start = toSec(w.Start);
    if (w.End != null) end = toSec(w.End);

    if (dur != null && end != null && start == null) start = end - dur;
    if (dur != null && start != null && end == null) end = start + dur;
    if (dur == null && start != null && end != null)
      dur = Math.max(0, end - start);

    out.push({
      ...w,
      start,
      end,
      durationSec: dur,
    });
  }

  return out;
}

export function getSpeakingRate(data) {
  var words =
    (data && data.NBest && data.NBest[0] && data.NBest[0].Words) || [];
  var totalSec = toSec(data && data.Duration);
  if (!Number.isFinite(totalSec)) {
    var sum = computeTimings(words)
      .map(function (t) {
        return t.durationSec;
      })
      .filter(Number.isFinite)
      .reduce(function (a, b) {
        return a + b;
      }, 0);
    totalSec = Number.isFinite(sum) && sum > 0 ? sum : null;
  }
  var count = words.length;
  if (!Number.isFinite(totalSec) || totalSec <= 0 || !count)
    return { wps: null, spw: null, label: "" };
  var wps = count / totalSec;
  var spw = totalSec / count;
  var label = "ok";
  if (wps < 2.0) label = "slow";
  else if (wps > 4.0) label = "fast";
  return { wps: wps, spw: spw, label: label };
}
