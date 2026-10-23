import { createServerClient, parseCookieHeader, serializeCookieHeader } from "@supabase/ssr";
import { getCookie, setCookie } from "@tanstack/react-start/server";

export function getSupabaseServerClient() {
  const supabaseUrl =
    process.env["SUPABASE_URL"] ||
    process.env["VITE_SUPABASE_URL"] ||
    "https://placeholder.supabase.co";
  const supabaseAnonKey =
    process.env["SUPABASE_ANON_KEY"] ||
    process.env["VITE_SUPABASE_ANON_KEY"] ||
    "placeholder-anon-key";

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        const cookieHeader = getCookie("sb-access-token") || "";
        return parseCookieHeader(cookieHeader);
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          const cookieStr = serializeCookieHeader(name, value, options);
          setCookie(name, cookieStr, {
            path: options?.path || "/",
            httpOnly: options?.httpOnly ?? true,
            secure: options?.secure ?? process.env["NODE_ENV"] === "production",
            sameSite: (options?.sameSite as "lax" | "strict" | "none") || "lax",
          });
        }
      },
    },
  });
}
