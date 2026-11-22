import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseSession() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookieOptions: { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" },
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (entries) => {
        for (const { name, value, options } of entries) cookieStore.set(name, value, options);
      },
    },
  });
}
