import { createServerClient } from "@supabase/ssr";
import { getCookies, setCookie, deleteCookie } from "@tanstack/react-start/server";
export { getSupabaseServiceClient } from "./supabaseService";

export function getSupabaseServerClient() {
  const supabaseUrl =
    process.env["SUPABASE_URL"] ||
    process.env["VITE_SUPABASE_URL"] ||
    "https://placeholder-supabase-url.supabase.co";
  const supabaseAnonKey =
    process.env["SUPABASE_ANON_KEY"] ||
    process.env["VITE_SUPABASE_ANON_KEY"] ||
    "placeholder-supabase-anon-key";

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        try {
          const cookies = getCookies();
          return Object.entries(cookies).map(([name, value]) => ({
            name,
            value: value ?? "",
          }));
        } catch {
          return [];
        }
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            if (!value) {
              deleteCookie(name, options as any);
            } else {
              setCookie(name, value, options as any);
            }
          }
        } catch {
          // Response headers already sent
        }
      },
    },
  });
}
