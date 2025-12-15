import { createClient } from '@supabase/supabase-js';

// Load keys from .env
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[Lux] Missing Supabase keys in .env');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Returns the Canonical User ID.
 * Priority:
 * 1. Authenticated User ID (if logged in)
 * 2. Guest ID (from localStorage)
 * 3. Null (creates new Guest ID upstream)
 */
export async function getCanonicalUID() {
  const { data } = await supabase.auth.getUser();
  
  if (data?.user?.id) {
    return data.user.id;
  }
  
  // Fallback to Guest ID
  if (window.LUX_USER_ID) {
    return window.LUX_USER_ID;
  }
  
  return null;
}