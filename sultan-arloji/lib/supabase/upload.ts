import { createClient } from "@supabase/supabase-js";
import { MEDIA_BUCKET } from "./media-config";

export async function uploadStoreImage(file: File, folder: "products" | "store"): Promise<string> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Konfigurasi penyimpanan Supabase belum lengkap.");

  const response = await fetch("/api/storage/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder, contentType: file.type, size: file.size }),
  });
  const ticket = await response.json().catch(() => null);
  if (!response.ok || typeof ticket?.path !== "string" || typeof ticket?.token !== "string" || typeof ticket?.url !== "string") {
    throw new Error(ticket?.error || "Izin unggah foto tidak dapat dibuat.");
  }

  const storage = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  }).storage.from(MEDIA_BUCKET);
  const { error } = await storage.uploadToSignedUrl(ticket.path, ticket.token, file, { contentType: file.type });
  if (error) throw new Error("Foto gagal diunggah ke Supabase Storage.", { cause: error });
  return ticket.url;
}
