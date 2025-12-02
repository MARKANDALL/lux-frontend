/* ============================================================================
   LEGACY DUPLICATE — DO NOT USE FOR NEW CODE
   ---------------------------------------------------------------------------
   This file defines an old norm() helper.
   Canonical norm now lives here:

     src/data/phonemes/core.js   ✅ truth source

   Live code should import norm from the canonical core or via ui/views/deps.js.
   Keep this only for reference until Phase 3 cleanup moves it to /legacy.
============================================================================ */
/* NON-MODULE: helpers & globals */
// fallbacks/data accessors
var G = window;
var norm =
  window.norm ||
  function norm(s) {
    return String(s || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  };
var getPhonemeAssetByIPA =
  window.getPhonemeAssetByIPA ||
  function () {
    return {};
  };
var articulatorPlacement = window.articulatorPlacement || {};
var phonemeDetailsByIPA = window.phonemeDetailsByIPA || {};
var ytLink = window.ytLink;

// tiny helpers
var isCorrupt =
  window.isCorrupt ||
  function (word) {
    return /[�‘’“”—–…•-￿]/.test(word);
  };
var encouragingLine =
  window.encouragingLine ||
  function () {
    var m = [
      "Great effort! Keep going—your persistence is paying off.",
      "Nice work! Every attempt brings you closer to perfect pronunciation.",
      "You're improving with every try—keep it up!",
      "Excellent focus! Small adjustments make a big difference.",
      "Keep practicing—you're making real progress!",
    ];
    return m[Math.floor(Math.random() * m.length)];
  };

var safePlayVideo =
  window.safePlayVideo ||
  function safePlayVideo(vidEl, canonicalUrl, opts) {
    opts = opts || {};
    if (!vidEl) return;
    var muted = opts.muted;
    var restart = "restart" in opts ? !!opts.restart : true;

    var needsBust = /(\.csb\.app|codesandbox\.io)$/i.test(location.hostname);
    if (needsBust && canonicalUrl) {
      var bust =
        canonicalUrl +
        (canonicalUrl.includes("?") ? "&" : "?") +
        "nocache=" +
        Date.now();
      if (vidEl.src !== bust) {
        vidEl.src = bust;
        vidEl.load();
      }
    }
    if (muted !== undefined) vidEl.muted = !!muted;
    if (restart) vidEl.currentTime = 0;
    var p = vidEl.play();
    if (p && typeof p.then === "function") p.catch(function () {});
  };

var resolveYTLink =
  window.resolveYTLink ||
  function resolveYTLink(arg) {
    try {
      if (typeof ytLink === "function") return ytLink(arg);
      if (typeof ytLink === "string") return ytLink;
    } catch (_) {}
    return null;
  };

var scoreClass =
  window.scoreClass ||
  function (score) {
    if (score == null) return "";
    if (score >= 85) return "score-good";
    if (score >= 70) return "score-warn";
    return "score-bad";
  };

var buildYouglishUrl =
  window.buildYouglishUrl ||
  function (word) {
    return (
      "https://youglish.com/pronounce/" + encodeURIComponent(word) + "/english"
    );
  };

var numOrNull =
  window.numOrNull ||
  function (v) {
    var n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
var fmtPct =
  window.fmtPct ||
  function (v) {
    if (v == null) return "–";
    var n = Number(v);
    if (!Number.isFinite(n)) return "–";
    return Number.isInteger(n) ? n + "%" : n.toFixed(1) + "%";
  };
