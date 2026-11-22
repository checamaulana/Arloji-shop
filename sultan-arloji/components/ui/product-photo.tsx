"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";

export function ProductPhoto({ src, alt, sizes, compact = false }: {
  src?: string;
  alt: string;
  sizes: string;
  compact?: boolean;
}) {
  const [failedSrc, setFailedSrc] = useState<string>();
  if (!src || src === failedSrc) {
    return (
      <div className="flex size-full flex-col items-center justify-center gap-1 px-1 text-center text-brand">
        <ImageOff size={20} aria-hidden="true" />
        <span className={compact ? "sr-only" : "text-xs leading-tight"}>Foto belum tersedia</span>
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      unoptimized
      sizes={sizes}
      className="object-contain"
      onError={() => setFailedSrc(src)}
    />
  );
}
