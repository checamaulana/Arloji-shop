export const MEDIA_BUCKET = "store-media";
export const IMAGE_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;
export const IMAGE_TYPES = Object.keys(IMAGE_EXTENSIONS);
export const IMAGE_SIZE_LIMIT = 10 * 1024 * 1024;
export const LOGO_SIZE_LIMIT = 5 * 1024 * 1024;

export function isImageType(value: unknown): value is keyof typeof IMAGE_EXTENSIONS {
  return typeof value === "string" && Object.hasOwn(IMAGE_EXTENSIONS, value);
}
