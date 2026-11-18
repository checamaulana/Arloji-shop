import type { ProductDocument } from "@/types/product";

export interface ProductInput {
  name: string;
  price: number;
  description: string;
  photos: string[];
  stock_status: ProductDocument["stock_status"];
}

export function isProductInput(value: unknown): value is ProductInput {
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
    input.photos.every(isValidPhotoUrl) &&
    (input.stock_status === "in_stock" || input.stock_status === "out_of_stock")
  );
}

function isValidPhotoUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2048) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
