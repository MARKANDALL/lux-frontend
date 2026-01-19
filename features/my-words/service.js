/**
 * features/my-words/service.js
 * Supabase persistence for authenticated users ONLY.
 */
import { supabase } from "../../src/supabase.js";
import { normalizeText } from "./normalize.js";

export async function getAuthedUID() {
  try {
    const { data } = await supabase.auth.getUser();
    return data?.user?.id || null;
  } catch {
    return null;
  }
}

export async function fetchMyWords(uid) {
  if (!uid) return [];

  const { data, error } = await supabase
    .from("my_words_entries")
    .select("*")
    .eq("uid", uid)
    .eq("archived", false)
    .order("pinned", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error) {
    console.warn("[my-words] fetchMyWords error:", error);
    return [];
  }

  return data || [];
}

export async function upsertManyMyWords(uid, texts) {
  if (!uid) return;

  const now = new Date().toISOString();
  const rows = (texts || [])
    .map((t) => String(t || "").trim())
    .filter(Boolean)
    .map((text) => ({
      uid,
      text,
      normalized_text: normalizeText(text),
      pinned: false,
      archived: false,
      updated_at: now,
    }));

  if (!rows.length) return;

  const { error } = await supabase
    .from("my_words_entries")
    .upsert(rows, {
      onConflict: "uid,normalized_text",
      ignoreDuplicates: true,
    });

  if (error) {
    console.warn("[my-words] upsertManyMyWords error:", error);
    throw error;
  }
}

export async function setPinned(uid, id, pinned) {
  if (!uid || !id) return;

  const { error } = await supabase
    .from("my_words_entries")
    .update({ pinned: !!pinned, updated_at: new Date().toISOString() })
    .eq("uid", uid)
    .eq("id", id);

  if (error) console.warn("[my-words] setPinned error:", error);
}

export async function archiveEntry(uid, id) {
  if (!uid || !id) return;

  const { error } = await supabase
    .from("my_words_entries")
    .update({ archived: true, updated_at: new Date().toISOString() })
    .eq("uid", uid)
    .eq("id", id);

  if (error) console.warn("[my-words] archiveEntry error:", error);
}

export async function deleteEntry(uid, id) {
  if (!uid || !id) return;

  const { error } = await supabase
    .from("my_words_entries")
    .delete()
    .eq("uid", uid)
    .eq("id", id);

  if (error) console.warn("[my-words] deleteEntry error:", error);
}
