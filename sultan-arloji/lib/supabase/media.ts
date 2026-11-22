import { getSupabaseAdmin } from "./admin";
import { MEDIA_BUCKET } from "./media-config";

export function mediaBucket() {
  return getSupabaseAdmin().storage.from(MEDIA_BUCKET);
}

export function getMediaPath(value: string, folder: "products" | "store"): string | null {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!baseUrl) return null;

  try {
    const root = new URL(`${baseUrl}/storage/v1/object/public/${MEDIA_BUCKET}/`);
    const url = new URL(value);
    if (url.origin !== root.origin || !url.pathname.startsWith(root.pathname)) return null;
    const path = decodeURIComponent(url.pathname.slice(root.pathname.length));
    return path.startsWith(`${folder}/`) && path.split("/").every((part) =>
      part && part !== "." && part !== ".." && /^[a-zA-Z0-9._-]+$/.test(part),
    ) ? path : null;
  } catch {
    return null;
  }
}
