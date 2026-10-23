import { createBrowserClient } from "@supabase/ssr";

export function getSupabaseBrowserClient() {
  const supabaseUrl =
    (typeof process !== "undefined" && process.env?.["VITE_SUPABASE_URL"]) ||
    "https://placeholder.supabase.co";
  const supabaseAnonKey =
    (typeof process !== "undefined" && process.env?.["VITE_SUPABASE_ANON_KEY"]) ||
    "placeholder-anon-key";

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
