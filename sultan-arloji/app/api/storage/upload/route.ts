import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth/verify-admin";
import { mediaBucket } from "@/lib/supabase/media";
import { IMAGE_EXTENSIONS, IMAGE_SIZE_LIMIT, LOGO_SIZE_LIMIT, isImageType } from "@/lib/supabase/media-config";

export async function POST(request: Request) {
  if (!(await verifyAdminRequest())) {
    return NextResponse.json({ error: "Sesi admin tidak valid." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const { folder, contentType, size } = body ?? {};
  if ((folder !== "products" && folder !== "store") || !isImageType(contentType) ||
      !Number.isSafeInteger(size) || size < 1 || size > (folder === "store" ? LOGO_SIZE_LIMIT : IMAGE_SIZE_LIMIT)) {
    return NextResponse.json({ error: "Jenis atau ukuran foto tidak valid." }, { status: 400 });
  }

  try {
    const bucket = mediaBucket();
    const path = `${folder}/${randomUUID()}.${IMAGE_EXTENSIONS[contentType]}`;
    const { data, error } = await bucket.createSignedUploadUrl(path);
    if (error) throw error;
    const { data: { publicUrl } } = bucket.getPublicUrl(path);
    return NextResponse.json({ path, token: data.token, url: publicUrl }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Could not create signed upload URL:", error);
    return NextResponse.json({ error: "Izin unggah foto tidak dapat dibuat." }, { status: 500 });
  }
}
