"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ImagePlus, LoaderCircle, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { IMAGE_SIZE_LIMIT, IMAGE_TYPES } from "@/lib/supabase/media-config";
import { uploadStoreImage } from "@/lib/supabase/upload";
import { ProductPhoto } from "@/components/ui/product-photo";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProductDocument } from "@/types/product";

const MAX_PHOTOS = 5;

type Photo = { url: string; enhancement?: "ai" | "local" };
type FieldErrors = { name?: string; price?: string; description?: string };
type Notice = { text: string; error?: boolean };

export function AdminProductForm({ productId }: { productId?: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [stockStatus, setStockStatus] = useState<ProductDocument["stock_status"]>("in_stock");
  const [isLoading, setIsLoading] = useState(Boolean(productId));
  const [loadError, setLoadError] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [galleryNotice, setGalleryNotice] = useState<Notice>();
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [enhancingIndex, setEnhancingIndex] = useState<number | null>(null);
  const operation = useRef<"upload" | "enhance" | "save" | null>(null);
  const busy = isSaving || isUploading || enhancingIndex !== null;

  useEffect(() => {
    if (!productId) return;
    let active = true;
    fetch("/api/products?admin=1", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Barang tidak dapat dimuat.");
        const product = (data.products as ProductDocument[]).find((item) => item.id === productId);
        if (!product) throw new Error("Barang tidak ditemukan.");
        if (!active) return;
        setName(product.name);
        setPrice(String(product.price));
        setDescription(product.description || "");
        setPhotos((product.photos ?? []).map((url) => ({ url })));
        setStockStatus(product.stock_status);
      })
      .catch((error: unknown) => {
        console.error("Could not load product for editing:", error);
        if (active) setLoadError(error instanceof Error ? error.message : "Barang tidak dapat dimuat.");
      })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [productId]);

  async function uploadPhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length || operation.current) return;

    const slots = MAX_PHOTOS - photos.length;
    if (slots <= 0) return;
    const selectedFiles = files.slice(0, slots);
    if (selectedFiles.some((file) => !IMAGE_TYPES.includes(file.type) || file.size > IMAGE_SIZE_LIMIT)) {
      setGalleryNotice({ text: "Gunakan JPG, PNG, atau WebP dengan ukuran maksimal 10 MB per foto.", error: true });
      return;
    }

    operation.current = "upload";
    setGalleryNotice(undefined);
    setIsUploading(true);
    try {
      const uploaded = await Promise.all(selectedFiles.map(async (file) => {
        return { url: await uploadStoreImage(file, "products") };
      }));
      setPhotos((current) => [...current, ...uploaded].slice(0, MAX_PHOTOS));
      setGalleryNotice({ text: files.length > slots
        ? `${uploaded.length} foto diunggah. Maksimal ${MAX_PHOTOS} foto per barang.`
        : `${uploaded.length} foto berhasil diunggah.` });
    } catch (error) {
      console.error("Could not upload product photos:", error);
      setGalleryNotice({ text: error instanceof Error ? error.message : "Gagal mengunggah foto.", error: true });
    } finally {
      operation.current = null;
      setIsUploading(false);
    }
  }

  async function enhancePhoto(index: number) {
    if (operation.current || photos.length >= MAX_PHOTOS || !photos[index]) return;

    operation.current = "enhance";
    setGalleryNotice(undefined);
    setEnhancingIndex(index);
    try {
      const response = await fetch("/api/ai/enhance-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: photos[index].url }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || typeof data?.enhanced_image_url !== "string" || !data.enhanced_image_url) {
        throw new Error(data?.error || "Foto tidak dapat disempurnakan.");
      }
      const enhancement = data.enhancement_method === "local" ? "local" : "ai";
      const enhancedPhoto: Photo = { url: data.enhanced_image_url, enhancement };
      setPhotos((current) => [...current, enhancedPhoto].slice(0, MAX_PHOTOS));
      setGalleryNotice({ text: enhancement === "local"
        ? "Cloudflare menolak hasil AI. Foto dengan kontras dan ketajaman yang disesuaikan ditambahkan ke galeri."
        : "Hasil AI ditambahkan ke galeri." });
    } catch (error) {
      console.error("Could not enhance product photo:", error);
      setGalleryNotice({ text: error instanceof Error ? error.message : "Gagal menyempurnakan foto.", error: true });
    } finally {
      operation.current = null;
      setEnhancingIndex(null);
    }
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (operation.current) return;

    const parsedPrice = Number(price);
    const fieldErrors: FieldErrors = {};
    if (!name.trim() || name.length > 160) fieldErrors.name = "Masukkan nama barang hingga 160 karakter.";
    if (!price.trim() || !Number.isInteger(parsedPrice) || parsedPrice < 0) fieldErrors.price = "Masukkan harga berupa angka bulat mulai dari 0.";
    if (description.length > 2000) fieldErrors.description = "Masukkan keterangan hingga 2.000 karakter.";
    setErrors(fieldErrors);
    const firstInvalid = Object.keys(fieldErrors)[0];
    if (firstInvalid) {
      event.currentTarget.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }

    operation.current = "save";
    setSaveError("");
    setIsSaving(true);
    try {
      const response = await fetch(productId ? `/api/products/${encodeURIComponent(productId)}` : "/api/products", {
        method: productId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          price: parsedPrice,
          description: description.trim(),
          photos: photos.map(({ url }) => url),
          stock_status: stockStatus,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Barang tidak dapat disimpan.");
      toast.success(productId ? "Barang berhasil diperbarui." : "Barang berhasil ditambahkan.");
      router.replace("/admin/barang");
    } catch (error) {
      console.error("Could not save product:", error);
      setSaveError(error instanceof Error ? error.message : "Gagal menyimpan barang.");
    } finally {
      operation.current = null;
      setIsSaving(false);
    }
  }

  return (
    <div className="page">
      <Link href="/admin/barang" className="action action-ghost -ml-3 mb-2"><ArrowLeft aria-hidden="true" /> Kembali ke barang</Link>
      <h1>{productId ? "Edit barang" : "Tambah barang"}</h1>

      {isLoading ? (
        <section className="card mt-4 space-y-4 p-4" aria-busy="true">
          <p className="sr-only" role="status">Memuat barang…</p>
          <Skeleton className="h-11 w-full" aria-hidden="true" />
          <Skeleton className="h-11 w-full" aria-hidden="true" />
          <Skeleton className="h-24 w-full" aria-hidden="true" />
        </section>
      ) : loadError ? (
        <p className="notice notice-error mt-4" role="alert">{loadError}</p>
      ) : (
        <form className="mt-4 space-y-4" noValidate onSubmit={saveProduct}>
          <section className="card space-y-4 p-4" aria-labelledby="product-information">
            <h2 id="product-information">Informasi barang</h2>
            <label className="field-label" htmlFor="product-name">Nama barang
              <input id="product-name" name="name" className="field" required maxLength={160} value={name} onChange={(event) => { setName(event.target.value); setErrors((current) => ({ ...current, name: undefined })); }} aria-invalid={!!errors.name} aria-describedby={errors.name ? "product-name-error" : undefined} />
              {errors.name && <span className="field-error" id="product-name-error">{errors.name}</span>}
            </label>

            <label className="field-label" htmlFor="product-price">Harga (Rupiah)
              <input id="product-price" name="price" className="field" required min={0} step={1} type="number" inputMode="numeric" value={price} onChange={(event) => { setPrice(event.target.value); setErrors((current) => ({ ...current, price: undefined })); }} aria-invalid={!!errors.price} aria-describedby={errors.price ? "product-price-error" : undefined} />
              {errors.price && <span className="field-error" id="product-price-error">{errors.price}</span>}
            </label>

            <label className="field-label" htmlFor="product-description">Keterangan
              <textarea id="product-description" name="description" className="field" rows={4} maxLength={2000} value={description} onChange={(event) => { setDescription(event.target.value); setErrors((current) => ({ ...current, description: undefined })); }} aria-invalid={!!errors.description} aria-describedby={errors.description ? "product-description-error" : undefined} />
              {errors.description && <span className="field-error" id="product-description-error">{errors.description}</span>}
            </label>

            <label className="field-label" htmlFor="product-stock">Status stok
              <select id="product-stock" className="field" value={stockStatus} onChange={(event) => setStockStatus(event.target.value as ProductDocument["stock_status"])}>
                <option value="in_stock">Tersedia</option>
                <option value="out_of_stock">Habis</option>
              </select>
            </label>
          </section>

          <section className="card space-y-3 p-4" aria-labelledby="product-photos">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="product-photos">Foto produk</h2>
              <p className="text-sm text-muted-foreground tabular-nums">{photos.length}/{MAX_PHOTOS} foto</p>
            </div>
            <p className="text-sm text-muted-foreground" id="photo-requirements">JPG, PNG, atau WebP. Maksimal 10 MB per foto.</p>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,120px),1fr))] gap-3">
              {photos.map((photo, index) => (
                <div key={`${photo.url}-${index}`} className="min-w-0 rounded-xl border border-border">
                  <div className="relative aspect-square rounded-t-xl bg-brand-tint">
                    <ProductPhoto src={photo.url} alt={`Foto barang ${index + 1}`} sizes="(max-width: 359px) 90vw, (max-width: 448px) 45vw, 200px" />
                    <button type="button" disabled={busy} aria-label={`Hapus foto ${index + 1}`} onClick={() => setPhotos((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="action action-danger action-icon absolute top-1 right-1 bg-surface"><X aria-hidden="true" /></button>
                    {photo.enhancement && (
                      <span className="status-badge absolute bottom-1 left-1 bg-surface text-brand">
                        {photo.enhancement === "ai" ? "Hasil AI" : "Disesuaikan"}
                      </span>
                    )}
                  </div>
                  <div className="p-2">
                    <button
                      type="button"
                      className="action action-secondary w-full px-1 text-xs"
                      disabled={busy || photos.length >= MAX_PHOTOS}
                      aria-label={enhancingIndex === index ? `Menyempurnakan foto ${index + 1}` : `Sempurnakan dengan AI, foto ${index + 1}`}
                      onClick={() => void enhancePhoto(index)}
                    >
                      {enhancingIndex === index ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
                      {enhancingIndex === index ? "Menyempurnakan foto…" : "Sempurnakan dengan AI"}
                    </button>
                  </div>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <label className="action action-secondary relative min-h-28 cursor-pointer flex-col border-dashed p-3 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand has-disabled:cursor-default has-disabled:bg-muted">
                  {isUploading ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <ImagePlus aria-hidden="true" />}
                  <span>{isUploading ? "Mengunggah foto…" : "Unggah foto"}</span>
                  <input type="file" accept={IMAGE_TYPES.join(",")} multiple disabled={busy} onChange={(event) => void uploadPhotos(event)} aria-describedby="photo-requirements" className="sr-only" />
                </label>
              )}
            </div>
            {photos.length >= MAX_PHOTOS && <p className="text-sm text-muted-foreground">Hapus satu foto untuk menambahkan hasil penyempurnaan.</p>}
            <p role="status" className={galleryNotice ? `notice ${galleryNotice.error ? "notice-error" : "notice-success"}` : "sr-only"}>
              {galleryNotice?.text || (isUploading ? "Mengunggah foto…" : enhancingIndex !== null ? "Menyempurnakan foto…" : "")}
            </p>
          </section>

          {saveError && <p className="notice notice-error" role="alert">{saveError}</p>}
          <button type="submit" className="action action-primary w-full" disabled={busy}>
            {isSaving && <LoaderCircle className="animate-spin" aria-hidden="true" />}
            {isSaving ? "Menyimpan…" : productId ? "Simpan perubahan" : "Simpan barang"}
          </button>
        </form>
      )}
    </div>
  );
}
