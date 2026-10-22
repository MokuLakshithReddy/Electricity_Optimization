import { createClient } from "@supabase/supabase-js";

export function getSupabaseServiceClient() {
  const supabaseUrl =
    process.env["SUPABASE_URL"] ||
    process.env["VITE_SUPABASE_URL"] ||
    "https://placeholder-supabase-url.supabase.co";
  const serviceKey =
    process.env["SUPABASE_SERVICE_ROLE_KEY"] ||
    process.env["VITE_SUPABASE_SERVICE_ROLE_KEY"] ||
    "";

  if (!serviceKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
