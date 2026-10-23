import { createBrowserClient } from "@supabase/ssr";

export function getSupabaseBrowserClient() {
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
  const supabaseUrl =
    env?.["VITE_SUPABASE_URL"] ||
    (typeof process !== "undefined" ? process.env?.["SUPABASE_URL"] : "") ||
    "https://placeholder-supabase-url.supabase.co";
  const supabaseAnonKey =
    env?.["VITE_SUPABASE_ANON_KEY"] ||
    (typeof process !== "undefined" ? process.env?.["SUPABASE_ANON_KEY"] : "") ||
    "placeholder-supabase-anon-key";

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
