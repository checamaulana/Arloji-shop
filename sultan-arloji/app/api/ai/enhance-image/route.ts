import { NextResponse } from "next/server";
import sharp from "sharp";
import { verifyAdminRequest } from "@/lib/auth/verify-admin";
import { getMediaPath, mediaBucket } from "@/lib/supabase/media";
import { IMAGE_SIZE_LIMIT, isImageType } from "@/lib/supabase/media-config";

const STUDIO_PROMPT =
  "Retouch image 0 as a realistic catalog photo of the same wristwatch. " +
  "Improve exposure, contrast, and clarity with soft, even lighting and a clean charcoal studio background. " +
  "Show the watch from a slightly elevated three-quarter front view, keeping the entire watch in frame and the dial readable. " +
  "Preserve the watch's design, proportions, colors, dial, hands, strap, logos, and lettering.";
// FLUX.2 reference images must be smaller than 512 × 512 pixels.
const MAX_REFERENCE_SIDE = 511;
const GENERATED_IMAGE_SIDE = "512";
const MAX_ADJUSTED_SIDE = 1920;

export async function POST(request: Request) {
  if (!(await verifyAdminRequest())) {
    return NextResponse.json({ error: "Sesi admin tidak valid." }, { status: 401 });
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const apiToken = process.env.CLOUDFLARE_API_TOKEN?.trim();
  const modelId = process.env.CLOUDFLARE_MODEL_ID?.trim() || "@cf/black-forest-labs/flux-2-klein-4b";
  if (!accountId || !apiToken) {
    return NextResponse.json(
      { error: "Konfigurasi Cloudflare Workers AI belum lengkap." },
      { status: 503 }
    );
  }
  if (!/^@[\w-]+\/[a-z0-9][\w.-]*\/[a-z0-9][\w.-]*$/i.test(modelId)) {
    return NextResponse.json({ error: "ID model Cloudflare tidak valid." }, { status: 503 });
  }

  try {
    let source: Blob;
    if (request.headers.get("content-type")?.startsWith("multipart/form-data")) {
      const form = await request.formData().catch(() => null);
      const file = form?.get("image");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "Foto sumber tidak valid." }, { status: 400 });
      }
      source = file;
    } else {
      const body = await request.json().catch(() => null);
      const sourcePath = typeof body?.image_url === "string" ? getMediaPath(body.image_url, "products") : null;
      if (!sourcePath) {
        return NextResponse.json({ error: "URL foto sumber tidak valid." }, { status: 400 });
      }
      const { data, error } = await mediaBucket().download(sourcePath, {}, { signal: AbortSignal.timeout(15_000) });
      if (error || !data) {
        return NextResponse.json({ error: "Foto sumber tidak dapat diunduh." }, { status: 400 });
      }
      source = data;
    }

    if (!isImageType(source.type) || source.size === 0 || source.size > IMAGE_SIZE_LIMIT) {
      return NextResponse.json(
        { error: "Foto harus berupa gambar berukuran maksimal 10 MB." },
        { status: 400 }
      );
    }

    const sourceImage = sharp(await source.arrayBuffer()).autoOrient();
    const reference = await sourceImage.clone()
      .resize(MAX_REFERENCE_SIDE, MAX_REFERENCE_SIDE, { fit: "inside", withoutEnlargement: true })
      .png().toBuffer().catch(() => null);
    if (!reference) {
      return NextResponse.json({ error: "Foto sumber tidak dapat dibaca." }, { status: 400 });
    }

    const formData = new FormData();
    formData.set("prompt", STUDIO_PROMPT);
    formData.set("width", GENERATED_IMAGE_SIDE);
    formData.set("height", GENERATED_IMAGE_SIDE);
    formData.set("input_image_0", new Blob([new Uint8Array(reference)], { type: "image/png" }), "source.png");

    const aiResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/run/${modelId}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${apiToken}` },
        body: formData,
        signal: AbortSignal.timeout(120_000),
      }
    );

    const aiResult = await aiResponse.json().catch(() => null) as { errors?: { code?: number }[] } | null;
    const moderationRejected = Array.isArray(aiResult?.errors)
      && aiResult.errors.some((error) => error?.code === 3030);
    const fallbackReason = aiResponse.status === 429 ? "rate_limit"
      : !aiResponse.ok && moderationRejected ? "moderation" : null;
    const useLocalAdjustment = fallbackReason !== null;
    if (!aiResponse.ok && !useLocalAdjustment) {
      console.error("Cloudflare Workers AI request failed:", aiResponse.status, aiResult);
      return NextResponse.json(
        { error: "Cloudflare gagal menyempurnakan foto." },
        { status: 502 }
      );
    }

    let imageBuffer: Buffer;
    if (useLocalAdjustment) {
      imageBuffer = await sourceImage
        .resize(MAX_ADJUSTED_SIDE, MAX_ADJUSTED_SIDE, { fit: "inside", withoutEnlargement: true })
        .normalise()
        .sharpen()
        .webp({ quality: 88 })
        .toBuffer();
    } else {
      const image = getGeneratedImage(aiResult);
      if (!image) {
        console.error("Cloudflare Workers AI response did not contain an image.");
        return NextResponse.json({ error: "Cloudflare tidak mengembalikan gambar hasil." }, { status: 502 });
      }

      const base64Image = image.startsWith("data:") ? image.slice(image.indexOf(",") + 1) : image;
      imageBuffer = Buffer.from(base64Image, "base64");
    }

    if (imageBuffer.length === 0 || imageBuffer.length > IMAGE_SIZE_LIMIT) {
      return NextResponse.json(
        { error: "Ukuran foto hasil penyempurnaan tidak valid." },
        { status: 502 }
      );
    }

    const metadata = await sharp(imageBuffer).metadata().catch(() => null);
    const resultType = `image/${metadata?.format}`;
    if (!isImageType(resultType) || imageBuffer.length > IMAGE_SIZE_LIMIT) {
      return NextResponse.json({ error: "Format atau ukuran foto hasil penyempurnaan tidak valid." }, { status: 502 });
    }

    const headers = new Headers({
      "Content-Type": resultType,
      "Cache-Control": "private, no-store",
      "X-Enhancement-Method": useLocalAdjustment ? "local" : "ai",
    });
    if (fallbackReason) headers.set("X-Enhancement-Fallback", fallbackReason);
    return new Response(new Uint8Array(imageBuffer), { headers });
  } catch (error) {
    console.error("Error enhancing product photo:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menyempurnakan foto." },
      { status: 500 }
    );
  }
}

function getGeneratedImage(value: unknown): string | undefined {
  if (typeof value !== "object" || value === null || !("result" in value)) {
    return undefined;
  }
  const result = value.result;
  if (typeof result !== "object" || result === null || !("image" in result)) {
    return undefined;
  }
  return typeof result.image === "string" ? result.image : undefined;
}
