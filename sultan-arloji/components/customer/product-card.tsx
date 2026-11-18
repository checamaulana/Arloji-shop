"use client";

import React, { useState } from "react";
import { ProductDocument } from "@/types/product";
import { formatRupiah } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Camera, ShoppingBag, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  product: ProductDocument;
  onOrder: (product: ProductDocument) => void;
}

export function ProductCard({ product, onOrder }: ProductCardProps) {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const photos = product.photos && product.photos.length > 0
    ? product.photos
    : ["https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&auto=format&fit=crop&q=80"];

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const isAvailable = product.stock_status === "in_stock";

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-[#171717] transition-all hover:border-neutral-700">
      {/* Photo Frame Container (Aspect 1:1) */}
      <div className="relative aspect-square w-full overflow-hidden bg-neutral-900 select-none">
        <img
          src={photos[activePhotoIndex]}
          alt={product.name}
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />

        {/* Gradient Overlay bottom for badge readability */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

        {/* Photo Navigation Arrows (visible if more than 1 photo) */}
        {photos.length > 1 && (
          <>
            <button
              onClick={handlePrevPhoto}
              aria-label="Foto Sebelumnya"
              className="absolute left-2 top-1/2 -translate-y-1/2 size-7 rounded-full bg-black/60 backdrop-blur-sm text-white/90 flex items-center justify-center hover:bg-black/90 transition-all active:scale-95 border border-white/10"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={handleNextPhoto}
              aria-label="Foto Berikutnya"
              className="absolute right-2 top-1/2 -translate-y-1/2 size-7 rounded-full bg-black/60 backdrop-blur-sm text-white/90 flex items-center justify-center hover:bg-black/90 transition-all active:scale-95 border border-white/10"
            >
              <ChevronRight className="size-4" />
            </button>
          </>
        )}

        {/* Photo Count Badge */}
        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-full bg-black/70 backdrop-blur-md px-2.5 py-1 text-[11px] font-medium text-white/90 border border-white/10">
          <Camera className="size-3 text-[#D4AF37]" />
          <span>
            {photos.length > 1
              ? `${activePhotoIndex + 1}/${photos.length} Foto`
              : "1 Foto"}
          </span>
        </div>

        {/* Stock Status Badge */}
        <div className="absolute top-2.5 right-2.5">
          {isAvailable ? (
            <Badge className="bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="size-3 text-emerald-400" />
              Tersedia
            </Badge>
          ) : (
            <Badge className="bg-rose-950/80 text-rose-300 border border-rose-500/30 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
              <AlertCircle className="size-3 text-rose-400" />
              Habis
            </Badge>
          )}
        </div>
      </div>

      {/* Product Details */}
      <div className="flex flex-1 flex-col p-4 justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white line-clamp-2 leading-snug">
            {product.name}
          </h2>

          {product.description && (
            <p className="mt-1 text-xs text-neutral-400 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}
        </div>

        {/* Price and CTA Button */}
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-neutral-800/80 pt-3">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-neutral-400">Harga</span>
            <p className="text-base font-bold text-[#D4AF37]">
              {formatRupiah(product.price)}
            </p>
          </div>

          <Button
            onClick={() => onOrder(product)}
            disabled={!isAvailable}
            className="h-9 px-4 rounded-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium text-xs shadow-md shadow-emerald-950/40 flex items-center gap-1.5 transition-all"
          >
            <ShoppingBag className="size-3.5" />
            <span>Pesan</span>
          </Button>
        </div>
      </div>
    </article>
  );
}
