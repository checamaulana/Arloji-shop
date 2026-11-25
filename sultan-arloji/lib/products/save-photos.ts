import { randomUUID } from "node:crypto";
import { mediaBucket } from "@/lib/supabase/media";
import { IMAGE_EXTENSIONS, isImageType } from "@/lib/supabase/media-config";

export async function saveWithProductPhotos(
  photos: (string | File)[],
  save: (urls: string[]) => PromiseLike<{ data: { id: string } | null; error: unknown; status: number }>,
) {
  const urls: string[] = [];
  const paths: string[] = [];
  let bucket: ReturnType<typeof mediaBucket> | undefined;
  let discardUploads = true;

  try {
    for (const photo of photos) {
      if (typeof photo === "string") {
        urls.push(photo);
        continue;
      }

      if (!isImageType(photo.type)) throw new Error("Format foto tidak valid.");
      bucket ??= mediaBucket();
      const path = `products/enhanced/${randomUUID()}.${IMAGE_EXTENSIONS[photo.type]}`;
      paths.push(path);
      const { error } = await bucket.upload(path, photo, { contentType: photo.type });
      if (error) throw error;
      urls.push(bucket.getPublicUrl(path).data.publicUrl);
    }

    const saving = save(urls);
    // A lost response can mean the row was saved. Keep its photos when the outcome is unknown.
    discardUploads = false;
    const { data, error, status } = await saving;
    discardUploads = error ? status >= 400 && status < 500 : !data;
    if (error) throw error;
    if (data) return data;
    return null;
  } finally {
    if (bucket && paths.length && discardUploads) {
      try {
        const { error } = await bucket.remove(paths);
        if (error) throw error;
      } catch (error) {
        console.error("Could not remove unsaved product photos:", error);
      }
    }
  }
}
