import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

/**
 * The Supabase client wants only the project address, e.g.
 * https://abcdxyz.supabase.co  (no /rest/v1, no trailing slash).
 * Keeping just the origin makes a slightly wrong value still work.
 */
function cleanUrl(value?: string): string | null {
  if (!value) return null;
  try {
    const origin = new URL(value).origin;
    if (!origin.includes("supabase")) {
      console.warn(
        "NEXT_PUBLIC_SUPABASE_URL should look like https://<project-ref>.supabase.co " +
          "(Project Settings → API → Project URL)."
      );
    }
    return origin;
  } catch {
    console.warn("NEXT_PUBLIC_SUPABASE_URL is not a valid URL. Running in demo mode.");
    return null;
  }
}

const url = cleanUrl(rawUrl);

/**
 * null when the env vars are missing, so the app keeps working on mock data.
 * Usage: if (supabase) { ...query } else { ...use mock data }
 */
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;

export const hasSupabase = supabase !== null;
