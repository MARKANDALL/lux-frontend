// features/my-words/store.js

import { normalizeText, splitLines } from "./normalize.js";

const LS_KEY_PREFIX = "lux_my_words_v1:";
const LS_OPEN_PREFIX = "lux_my_words_open_v1:";

function safeParse(json, fallback) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

function nowISO() {
  return new Date().toISOString();
}

function makeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "mw_" + Math.random().toString(16).slice(2) + "_" + Date.now().toString(16);
}

export function createMyWordsStore({ uid, onMutation } = {}) {
  const key = LS_KEY_PREFIX + String(uid || "anon");
  const openKey = LS_OPEN_PREFIX + String(uid || "anon");

  const subs = new Set();

  let state = {
    uid,
    open: false,
    query: "",
    entries: [],
  };

  function emit() {
    subs.forEach((fn) => {
      try {
        fn(state);
      } catch (_) {}
    });
  }

  function persist() {
    try {
      localStorage.setItem(key, JSON.stringify(state.entries));
    } catch (_) {}
  }

  function persistOpen() {
    try {
      localStorage.setItem(openKey, state.open ? "1" : "0");
    } catch (_) {}
  }

  function load() {
    try {
      const raw = localStorage.getItem(key) || "[]";
      const arr = safeParse(raw, []);
      state.entries = Array.isArray(arr) ? arr : [];
    } catch (_) {}

    try {
      const rawOpen = localStorage.getItem(openKey) || "0";
      state.open = rawOpen === "1";
    } catch (_) {}
  }

  function mut(payload) {
    try {
      onMutation?.(payload);
    } catch (_) {}
  }

  function getState() {
    return state;
  }

  function setOpen(open) {
    state.open = !!open;
    persistOpen();
    emit();
  }

  function toggleOpen() {
    setOpen(!state.open);
  }

  function setQuery(q) {
    state.query = String(q || "");
    emit();
  }

  function visibleEntries() {
    const q = normalizeText(state.query);
    return state.entries
      .filter((e) => !e.archived)
      .filter((e) => (q ? normalizeText(e.text).includes(q) : true))
      .sort((a, b) => {
        const ap = a.pinned ? 1 : 0;
        const bp = b.pinned ? 1 : 0;
        if (ap !== bp) return bp - ap;

        const at = new Date(a.mw_lastAt || a.updated_at || a.created_at || 0).getTime();
        const bt = new Date(b.mw_lastAt || b.updated_at || b.created_at || 0).getTime();
        return bt - at;
      });
  }

  function replaceEntries(entries) {
    state.entries = Array.isArray(entries) ? entries : [];
    persist();
    emit();
  }

  function addMany(rawOrLines) {
    const lines = Array.isArray(rawOrLines) ? rawOrLines : splitLines(rawOrLines);
    if (!lines.length) return { added: 0, merged: 0, lines: [] };

    const byNorm = new Map();
    state.entries.forEach((e) =>
      byNorm.set(normalizeText(e.normalized_text || e.text), e)
    );

    let added = 0;
    let merged = 0;

    lines.forEach((text) => {
      const norm = normalizeText(text);
      if (!norm) return;

      const existing = byNorm.get(norm);
      if (existing) {
        existing.text = text;
        existing.normalized_text = norm;
        existing.archived = false;
        existing.updated_at = nowISO();
        merged++;
      } else {
        const entry = {
          id: makeId(),
          uid: state.uid,
          text,
          normalized_text: norm,
          pinned: false,
          archived: false,
          created_at: nowISO(),
          updated_at: nowISO(),
        };
        state.entries.push(entry);
        byNorm.set(norm, entry);
        added++;
      }
    });

    if (added || merged) persist();
    emit();

    mut({ type: "addMany", lines, added, merged });

    return { added, merged, lines };
  }

  function togglePin(id) {
    const e = state.entries.find((x) => x.id === id);
    if (!e) return;
    e.pinned = !e.pinned;
    e.updated_at = nowISO();
    persist();
    emit();
    mut({ type: "togglePin", id, pinned: e.pinned });
  }

  function archive(id) {
    const e = state.entries.find((x) => x.id === id);
    if (!e) return;
    e.archived = true;
    e.updated_at = nowISO();
    persist();
    emit();
    mut({ type: "archive", id });
  }

  function restore(id) {
    const e = state.entries.find((x) => x.id === id);
    if (!e) return;
    e.archived = false;
    e.updated_at = nowISO();
    persist();
    emit();
    mut({ type: "restore", id });
  }

  function hardDelete(id) {
    state.entries = state.entries.filter((x) => x.id !== id);
    persist();
    emit();
    mut({ type: "hardDelete", id });
  }

  function subscribe(fn) {
    subs.add(fn);
    fn(state);
    return () => subs.delete(fn);
  }

  load();

  return {
    getState,
    subscribe,

    setOpen,
    toggleOpen,
    setQuery,
    visibleEntries,

    replaceEntries,
    addMany,
    togglePin,
    archive,
    restore, // ✅ add this
    hardDelete,
  };
}
