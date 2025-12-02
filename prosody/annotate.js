/* NON-MODULE: prosody/annotate.js
   Per-word tempo/gap classifiers + dev audit (depends on computeTimings & median)
*/
(function () {
  var G = window;

  var classifyTempo =
    G.classifyTempo ||
    function (durationSec, medianDur) {
      if (!Number.isFinite(durationSec)) return "ok";
      if (Number.isFinite(medianDur) && medianDur > 0) {
        if (durationSec >= medianDur * 1.45) return "slow";
        if (durationSec <= medianDur * 0.6) return "fast";
        return "ok";
      }
      if (durationSec > 0.65) return "slow";
      if (durationSec < 0.3) return "fast";
      return "ok";
    };

  var classifyGap =
    G.classifyGap ||
    function (prevEnd, currStart) {
      var pe = G.ticksToSec
        ? G.ticksToSec(prevEnd)
        : prevEnd == null
        ? null
        : Number(prevEnd);
      var cs = G.ticksToSec
        ? G.ticksToSec(currStart)
        : currStart == null
        ? null
        : Number(currStart);
      if (!Number.isFinite(pe) || !Number.isFinite(cs)) return "ok";
      var gap = cs - pe;
      if (!Number.isFinite(gap) || gap < 0) return "ok";
      if (gap > 0.6) return "unexpected";
      if (gap >= 0.35) return "missing";
      return "ok";
    };

  var devAuditProsody =
    G.devAuditProsody ||
    function (data, limit) {
      limit = Number.isFinite(limit) ? limit : 10;
      var words = data?.NBest?.[0]?.Words || [];
      var timings = (
        G.computeTimings ||
        function () {
          return [];
        }
      )(words);
      var med = (
        G.median ||
        function () {
          return null;
        }
      )(
        timings
          .map(function (t) {
            return t.durationSec;
          })
          .filter(Number.isFinite)
      );
      var rows = [];
      var lastEnd = null;
      for (var i = 0; i < Math.min(words.length, limit); i++) {
        var w = words[i] || {};
        var t = timings[i] || {};
        var gap =
          Number.isFinite(lastEnd) && Number.isFinite(t.start)
            ? +(t.start - lastEnd).toFixed(3)
            : null;
        rows.push({
          i,
          word: w.Word,
          rawOffset: w.Offset,
          rawDuration: w.Duration,
          startSec: t.start,
          durSec: t.durationSec,
          endSec: t.end,
          gapSec: gap,
          tempo: classifyTempo(t.durationSec, med),
          gapClass:
            i > 0 && Number.isFinite(gap)
              ? gap > 0.6
                ? "unexpected"
                : gap >= 0.35
                ? "missing"
                : "ok"
              : "n/a",
        });
        lastEnd = t.end;
      }
      console.table(rows);
      var hugeGaps = rows.filter(function (r) {
        return r.gapSec != null && r.gapSec > 5;
      });
      if (hugeGaps.length) {
        console.warn(
          "⚠️ Suspiciously large gaps (>5s). This usually means a unit mismatch (ms vs ticks vs s) in Offset/Duration:",
          hugeGaps
        );
      }
      return rows;
    };

  G.classifyTempo = G.classifyTempo || classifyTempo;
  G.classifyGap = G.classifyGap || classifyGap;
  G.devAuditProsody = G.devAuditProsody || devAuditProsody;
})();
