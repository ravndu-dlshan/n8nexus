import { redirect } from "@tanstack/react-router";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export async function requireAuth(): Promise<Session | undefined> {
  // Supabase session is in browser storage — skip on SSR so refresh doesn't bounce to /login.
  if (import.meta.env.SSR) return;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw redirect({ to: "/login" });
  }

  return session;
}

export async function redirectIfAuthenticated(): Promise<void> {
  if (import.meta.env.SSR) return;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    throw redirect({ to: "/dashboard" });
  }
}
