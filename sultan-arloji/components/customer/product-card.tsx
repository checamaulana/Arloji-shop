"use client";

import { useState, type MouseEvent } from "react";
import { Camera, ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import type { ProductDocument } from "@/types/product";
import { formatRupiah } from "@/lib/utils";
import { ProductPhoto } from "@/components/ui/product-photo";

export function ProductCard({ product, onOrder }: {
  product: ProductDocument;
  onOrder: (product: ProductDocument, trigger: HTMLButtonElement) => void;
}) {
  const [activePhoto, setActivePhoto] = useState(0);
  const photos = product.photos ?? [];
  const photoIndex = activePhoto < photos.length ? activePhoto : 0;
  const available = product.stock_status === "in_stock";

  function movePhoto(direction: number) {
    setActivePhoto((photoIndex + direction + photos.length) % photos.length);
  }

  return (
    <article className="flex items-start gap-3 border-b border-border px-3 py-4 last:border-b-0">
      <div className="photo-size shrink-0">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-brand-tint">
          <ProductPhoto
            key={photos[photoIndex]}
            src={photos[photoIndex]}
            alt={`${product.name} — foto ${photoIndex + 1}`}
            sizes="(max-width: 359px) 80px, (max-width: 479px) 24vw, 112px"
          />
          {photos.length > 0 && (
            <p className="absolute inset-x-1 bottom-1 flex w-fit items-center gap-1 rounded-full bg-brand-strong px-1.5 py-0.5 text-xs font-semibold leading-4 text-brand-foreground" aria-live="polite">
              <Camera size={12} aria-hidden="true" />
              {photoIndex + 1}/{photos.length} foto
            </p>
          )}
        </div>
        {photos.length > 1 && (
          <div className="mt-1 flex justify-between max-[359px]:-mx-1">
            <button type="button" className="action action-ghost action-icon" aria-label={`Foto sebelumnya untuk ${product.name}`} onClick={() => movePhoto(-1)}>
              <ChevronLeft aria-hidden="true" />
            </button>
            <button type="button" className="action action-ghost action-icon" aria-label={`Foto berikutnya untuk ${product.name}`} onClick={() => movePhoto(1)}>
              <ChevronRight aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold leading-[1.375] wrap-anywhere">{product.name}</h3>
        {product.description && <p className="mt-1 text-sm leading-5 wrap-anywhere text-muted-foreground">{product.description}</p>}
        <p className={`status-badge mt-2 ${available ? "status-success" : "status-danger"}`}>
          {available ? "Tersedia" : "Habis"}
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="min-w-0 text-lg leading-6 font-bold wrap-anywhere tabular-nums">{formatRupiah(product.price)}</p>
          <button
            type="button"
            className="action action-primary"
            disabled={!available}
            aria-label={`Pesan ${product.name}`}
            onClick={(event: MouseEvent<HTMLButtonElement>) => onOrder(product, event.currentTarget)}
          >
            <ShoppingBag aria-hidden="true" /> Pesan
          </button>
        </div>
      </div>
    </article>
  );
}
