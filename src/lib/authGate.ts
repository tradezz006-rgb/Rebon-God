import { isSupabaseConfigured } from "@/integrations/supabase/client";

/**
 * Production auth gate.
 *
 * - When Supabase is configured → auth is required for protected pages.
 * - Local teammate testing without login: set VITE_AUTH_OPTIONAL=true
 *   (never enable that flag in production Vercel env).
 */
const authOptional =
  import.meta.env.VITE_AUTH_OPTIONAL === "true" ||
  import.meta.env.VITE_AUTH_OPTIONAL === "1";

export const AUTH_REQUIRED = isSupabaseConfigured && !authOptional;
