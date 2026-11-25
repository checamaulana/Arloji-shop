import type { ProductDocument } from "@/types/product";
import { getMediaPath } from "@/lib/supabase/media";
import { IMAGE_SIZE_LIMIT, isImageType } from "@/lib/supabase/media-config";

interface ProductInput<TPhoto> {
  name: string;
  price: number;
  description: string;
  photos: TPhoto[];
  stock_status: ProductDocument["stock_status"];
}

export async function readProductInput(request: Request): Promise<ProductInput<string | File> | null> {
  if (request.headers.get("content-type")?.startsWith("multipart/form-data")) {
    const form = await request.formData().catch(() => null);
    if (!form) return null;
    const price = form.get("price");
    const input = {
      name: form.get("name"),
      price: typeof price === "string" && price.trim() ? Number(price) : null,
      description: form.get("description"),
      photos: form.getAll("photos"),
      stock_status: form.get("stock_status"),
    };
    return isProductInput(input, isValidPhoto) ? input : null;
  }

  const input: unknown = await request.json().catch(() => null);
  return isProductInput(input, isValidPhotoUrl) ? input : null;
}

function isProductInput<TPhoto>(value: unknown, isPhoto: (value: unknown) => value is TPhoto): value is ProductInput<TPhoto> {
  if (typeof value !== "object" || value === null) return false;
  const input = value as Record<string, unknown>;

  return (
    typeof input.name === "string" &&
    input.name.trim().length > 0 &&
    input.name.length <= 160 &&
    typeof input.price === "number" &&
    Number.isFinite(input.price) &&
    input.price >= 0 &&
    typeof input.description === "string" &&
    input.description.length <= 2000 &&
    Array.isArray(input.photos) &&
    input.photos.length <= 5 &&
    input.photos.every(isPhoto) &&
    (input.stock_status === "in_stock" || input.stock_status === "out_of_stock")
  );
}

function isValidPhoto(value: unknown): value is string | File {
  return isValidPhotoUrl(value) || (value instanceof File && isImageType(value.type) && value.size > 0 && value.size <= IMAGE_SIZE_LIMIT);
}

function isValidPhotoUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2048) return false;
  try {
    return new URL(value).protocol === "https:" || getMediaPath(value, "products") !== null;
  } catch {
    return false;
  }
}
