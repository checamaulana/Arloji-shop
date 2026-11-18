import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth/verify-admin";
import { adminDb, adminStorage } from "@/lib/firebase/admin";
import { isProductInput } from "@/lib/products/validation";

export async function PUT(request: Request, context: RouteContext<"/api/products/[id]">) {
  if (!(await verifyAdminRequest())) {
    return NextResponse.json({ error: "Sesi admin tidak valid." }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    const body: unknown = await request.json();
    if (!isProductInput(body)) {
      return NextResponse.json(
        { error: "Nama, harga, status stok, atau foto produk tidak valid." },
        { status: 400 }
      );
    }

    const productRef = adminDb.collection("products").doc(id);
    const existing = await productRef.get();
    if (!existing.exists) {
      return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });
    }

    const updated = {
      name: body.name.trim(),
      price: body.price,
      description: body.description.trim(),
      photos: body.photos,
      stock_status: body.stock_status,
      updated_at: FieldValue.serverTimestamp(),
    };
    await productRef.update(updated);

    return NextResponse.json({ success: true, product_id: id });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Gagal memperbarui produk." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext<"/api/products/[id]">) {
  if (!(await verifyAdminRequest())) {
    return NextResponse.json({ error: "Sesi admin tidak valid." }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    const productRef = adminDb.collection("products").doc(id);
    const existing = await productRef.get();
    if (!existing.exists) {
      return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });
    }

    const bucket = adminStorage.bucket();
    const storedPhotos = existing.data()?.photos;
    const photoPaths = Array.isArray(storedPhotos)
      ? storedPhotos
          .map((photo: unknown) => getProductStoragePath(photo, bucket.name))
          .filter((path): path is string => path !== null)
      : [];
    await Promise.all(
      photoPaths.map((path) => bucket.file(path).delete({ ignoreNotFound: true }))
    );
    await productRef.delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: "Gagal menghapus produk." }, { status: 500 });
  }
}

function getProductStoragePath(value: unknown, bucketName: string): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    const decodedPath = decodeURIComponent(url.pathname);
    let objectPath: string | null = null;

    if (
      url.hostname === "firebasestorage.googleapis.com" &&
      decodedPath.startsWith(`/v0/b/${bucketName}/o/`)
    ) {
      objectPath = decodedPath.slice(`/v0/b/${bucketName}/o/`.length);
    } else if (
      url.hostname === "storage.googleapis.com" &&
      decodedPath.startsWith(`/${bucketName}/`)
    ) {
      objectPath = decodedPath.slice(`/${bucketName}/`.length);
    }

    if (
      objectPath?.startsWith("products/") &&
      !objectPath.split("/").some((part) => part === "." || part === "..")
    ) {
      return objectPath;
    }
    return null;
  } catch {
    return null;
  }
}
