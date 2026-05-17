import { createClient, type SupabaseClientOptions } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const authOptions = {
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: true,
} satisfies NonNullable<SupabaseClientOptions<"public">["auth"]>;

async function createSupabaseOptions(): Promise<SupabaseClientOptions<"public">> {
  const options: SupabaseClientOptions<"public"> = { auth: authOptions };

  // TanStack Start SSR runs on Node < 22 — Realtime needs the `ws` transport.
  if (import.meta.env.SSR) {
    const { WebSocket } = await import("ws");
    options.realtime = { transport: WebSocket };
  }

  return options;
}

const options = await createSupabaseOptions();

export const supabase = createClient(
  supabaseUrl ?? "https://placeholder.supabase.co",
  supabaseAnonKey ?? "placeholder",
  options,
);
