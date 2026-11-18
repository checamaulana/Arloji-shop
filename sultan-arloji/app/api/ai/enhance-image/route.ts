import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth/verify-admin";
import { adminStorage } from "@/lib/firebase/admin";

const IMAGE_SIZE_LIMIT = 10 * 1024 * 1024;
const STUDIO_PROMPT =
  "luxury professional wristwatch product photography, preserve the exact watch design, dial, branding and proportions, sleek dark studio environment with subtle warm gold accents, dramatic professional studio rim lighting, sharp detailed dial and case, high-end commercial product photo";

export async function POST(request: Request) {
  if (!(await verifyAdminRequest())) {
    return NextResponse.json({ error: "Sesi admin tidak valid." }, { status: 401 });
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !apiToken) {
    return NextResponse.json(
      { error: "Konfigurasi Cloudflare Workers AI belum lengkap." },
      { status: 503 }
    );
  }

  try {
    const body: unknown = await request.json();
    const imageUrl =
      typeof body === "object" && body !== null && "image_url" in body
        ? body.image_url
        : undefined;
    if (
      typeof imageUrl !== "string" ||
      !isFirebaseStorageUrl(imageUrl, adminStorage.bucket().name)
    ) {
      return NextResponse.json({ error: "URL foto sumber tidak valid." }, { status: 400 });
    }

    const sourceResponse = await fetch(imageUrl, {
      signal: AbortSignal.timeout(15_000),
    });
    if (!sourceResponse.ok) {
      return NextResponse.json(
        { error: "Foto sumber tidak dapat diunduh." },
        { status: 400 }
      );
    }

    const contentType = sourceResponse.headers.get("content-type")?.split(";")[0];
    const contentLength = Number(sourceResponse.headers.get("content-length") || 0);
    if (
      !contentType ||
      !["image/jpeg", "image/png", "image/webp"].includes(contentType) ||
      contentLength > IMAGE_SIZE_LIMIT
    ) {
      return NextResponse.json(
        { error: "Foto harus berupa gambar berukuran maksimal 10 MB." },
        { status: 400 }
      );
    }

    const sourceBuffer = Buffer.from(await sourceResponse.arrayBuffer());
    if (sourceBuffer.length > IMAGE_SIZE_LIMIT) {
      return NextResponse.json(
        { error: "Ukuran foto melebihi batas 10 MB." },
        { status: 400 }
      );
    }

    const formData = new FormData();
    formData.set("prompt", STUDIO_PROMPT);
    formData.set(
      "image",
      new Blob([sourceBuffer], { type: contentType }),
      `source.${extensionForImage(contentType)}`
    );

    const modelId = process.env.CLOUDFLARE_MODEL_ID || "@cf/black-forest-labs/flux-2-klein-4b";
    const aiResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/run/${encodeURIComponent(modelId)}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${apiToken}` },
        body: formData,
        signal: AbortSignal.timeout(120_000),
      }
    );

    if (!aiResponse.ok) {
      const details = await aiResponse.text();
      console.error("Cloudflare Workers AI request failed:", aiResponse.status, details);
      return NextResponse.json(
        { error: "Cloudflare gagal menyempurnakan foto." },
        { status: 502 }
      );
    }

    const aiResult: unknown = await aiResponse.json();
    const image = getGeneratedImage(aiResult);
    if (!image) {
      console.error("Cloudflare Workers AI response did not contain an image.");
      return NextResponse.json(
        { error: "Cloudflare tidak mengembalikan gambar hasil." },
        { status: 502 }
      );
    }

    const base64Image = image.startsWith("data:") ? image.slice(image.indexOf(",") + 1) : image;
    const imageBuffer = Buffer.from(base64Image, "base64");
    if (imageBuffer.length === 0 || imageBuffer.length > IMAGE_SIZE_LIMIT) {
      return NextResponse.json(
        { error: "Ukuran gambar hasil AI tidak valid." },
        { status: 502 }
      );
    }

    const bucket = adminStorage.bucket();
    const path = `products/ai-enhanced/${randomUUID()}.png`;
    const downloadToken = randomUUID();
    await bucket.file(path).save(imageBuffer, {
      resumable: false,
      metadata: {
        contentType: "image/png",
        metadata: { firebaseStorageDownloadTokens: downloadToken },
      },
    });

    const url = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket.name)}/o/${encodeURIComponent(path)}?alt=media&token=${downloadToken}`;
    return NextResponse.json({ enhanced_image_url: url });
  } catch (error) {
    console.error("Error enhancing product photo:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menyempurnakan foto." },
      { status: 500 }
    );
  }
}

function isFirebaseStorageUrl(value: string, bucketName: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    const path = decodeURIComponent(url.pathname);
    if (url.hostname === "firebasestorage.googleapis.com") {
      return path.startsWith(`/v0/b/${bucketName}/o/products/`);
    }
    return (
      url.hostname === "storage.googleapis.com" &&
      path.startsWith(`/${bucketName}/products/`)
    );
  } catch {
    return false;
  }
}

function extensionForImage(contentType: string): string {
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  return "jpg";
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
