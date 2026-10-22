import { createBrowserClient } from "@supabase/ssr";

export function getSupabaseBrowserClient() {
  const supabaseUrl =
    (import.meta as any).env?.VITE_SUPABASE_URL ||
    (typeof process !== "undefined" ? process.env?.["SUPABASE_URL"] : "") ||
    "https://placeholder-supabase-url.supabase.co";
  const supabaseAnonKey =
    (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
    (typeof process !== "undefined" ? process.env?.["SUPABASE_ANON_KEY"] : "") ||
    "placeholder-supabase-anon-key";

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
