import type { User } from "@supabase/supabase-js";
import { createSupabaseSession } from "@/lib/supabase/session";

export function isAdmin(user: User | null): user is User {
  return user?.app_metadata.role === "admin";
}

export async function getAdminSession() {
  try {
    const supabase = await createSupabaseSession();
    if (!supabase) return null;
    const { data: { user }, error } = await supabase.auth.getUser();
    return !error && isAdmin(user) ? { supabase, user } : null;
  } catch (error) {
    console.error("Could not verify admin session:", error);
    return null;
  }
}

export async function verifyAdminRequest(): Promise<boolean> {
  return (await getAdminSession()) !== null;
}
