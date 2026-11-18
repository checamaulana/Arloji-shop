"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { ArrowLeft, ImagePlus, LoaderCircle, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { auth, storage } from "@/lib/firebase/client";
import type { ProductDocument } from "@/types/product";

const MAX_PHOTOS = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function AdminProductForm({ productId }: { productId?: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [stockStatus, setStockStatus] = useState<ProductDocument["stock_status"]>("in_stock");
  const [isLoading, setIsLoading] = useState(Boolean(productId));
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [enhancingIndex, setEnhancingIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!productId) return;
    let active = true;
    fetch("/api/products?admin=1", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Produk tidak dapat dimuat.");
        const product = (data.products as ProductDocument[]).find((item) => item.id === productId);
        if (!product) throw new Error("Produk tidak ditemukan.");
        if (!active) return;
        setName(product.name);
        setPrice(String(product.price));
        setDescription(product.description || "");
        setPhotos(product.photos || []);
        setStockStatus(product.stock_status);
      })
      .catch((error: unknown) => {
        console.error("Could not load product for editing:", error);
        if (active) toast.error(error instanceof Error ? error.message : "Gagal memuat produk.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [productId]);

  async function uploadPhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;

    const availableSlots = MAX_PHOTOS - photos.length;
    const selectedFiles = files.slice(0, availableSlots);
    if (files.length > availableSlots) {
      toast.error(`Maksimal ${MAX_PHOTOS} foto per produk.`);
    }
    if (selectedFiles.some((file) => !ACCEPTED_TYPES.includes(file.type) || file.size > MAX_FILE_SIZE)) {
      toast.error("Gunakan JPG, PNG, atau WebP dengan ukuran maksimal 10 MB per foto.");
      return;
    }

    setUploadingCount(selectedFiles.length);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Sesi Firebase berakhir. Silakan login kembali.");
      await user.getIdToken();
      const uploadedUrls = await Promise.all(
        selectedFiles.map(async (file) => {
          const path = `products/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
          const result = await uploadBytes(ref(storage, path), file, { contentType: file.type });
          return getDownloadURL(result.ref);
        })
      );
      setPhotos((current) => [...current, ...uploadedUrls].slice(0, MAX_PHOTOS));
      toast.success(`${uploadedUrls.length} foto berhasil diunggah.`);
    } catch (error) {
      console.error("Could not upload product photos:", error);
      toast.error(error instanceof Error ? error.message : "Gagal mengunggah foto.");
    } finally {
      setUploadingCount(0);
    }
  }

  async function enhancePhoto(index: number) {
    if (photos.length >= MAX_PHOTOS) {
      toast.error("Hapus satu foto terlebih dahulu untuk menambahkan hasil AI.");
      return;
    }

    setEnhancingIndex(index);
    try {
      const response = await fetch("/api/ai/enhance-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: photos[index] }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Foto tidak dapat disempurnakan.");
      setPhotos((current) => [...current, data.enhanced_image_url].slice(0, MAX_PHOTOS));
      toast.success("Foto studio AI berhasil ditambahkan.");
    } catch (error) {
      console.error("Could not enhance product photo:", error);
      toast.error(error instanceof Error ? error.message : "Gagal menyempurnakan foto.");
    } finally {
      setEnhancingIndex(null);
    }
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedPrice = Number(price);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      toast.error("Harga harus berupa angka nol atau lebih.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(
        productId ? `/api/products/${encodeURIComponent(productId)}` : "/api/products",
        {
          method: productId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            price: parsedPrice,
            description: description.trim(),
            photos,
            stock_status: stockStatus,
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Produk tidak dapat disimpan.");
      toast.success(productId ? "Produk berhasil diperbarui." : "Produk berhasil ditambahkan.");
      router.replace("/admin/barang");
    } catch (error) {
      console.error("Could not save product:", error);
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan produk.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <div className="px-5 py-16 text-center text-sm text-neutral-400">Memuat produk...</div>;
  }

  return (
    <main className="px-5 pb-8 pt-7">
      <Link href="/admin/barang" className="mb-5 inline-flex items-center gap-2 text-xs text-neutral-400 hover:text-white">
        <ArrowLeft className="size-4" />
        Kembali ke barang
      </Link>
      <h1 className="text-2xl font-semibold text-white">{productId ? "Edit Produk" : "Tambah Barang"}</h1>
      <p className="mt-1 text-sm text-neutral-400">Informasi produk dan galeri foto.</p>

      <form onSubmit={saveProduct} className="mt-6 space-y-5">
        <label className="block space-y-2 text-xs font-medium text-neutral-300">
          Nama barang <span className="text-red-400">*</span>
          <input
            required
            maxLength={160}
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-11 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 text-sm text-white outline-none focus:border-[#D4AF37]"
            placeholder="Nama jam tangan"
          />
        </label>

        <label className="block space-y-2 text-xs font-medium text-neutral-300">
          Harga (Rupiah) <span className="text-red-400">*</span>
          <input
            required
            min="0"
            step="1"
            type="number"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            className="h-11 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 text-sm text-white outline-none focus:border-[#D4AF37]"
            placeholder="245000000"
          />
        </label>

        <label className="block space-y-2 text-xs font-medium text-neutral-300">
          Keterangan
          <textarea
            rows={4}
            maxLength={2000}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
            placeholder="Deskripsi atau spesifikasi produk (opsional)"
          />
        </label>

        <fieldset className="space-y-3">
          <legend className="text-xs font-medium text-neutral-300">
            Foto produk <span className="text-neutral-500">({photos.length}/{MAX_PHOTOS})</span>
          </legend>
          <div className="grid grid-cols-2 gap-3">
            {photos.map((photo, index) => (
              <div key={`${photo}-${index}`} className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900">
                <div className="relative aspect-square">
                  <Image
                    src={photo}
                    alt={`Foto produk ${index + 1}`}
                    fill
                    unoptimized
                    sizes="(max-width: 448px) 50vw, 224px"
                    className="object-cover"
                  />
                  <button
                    type="button"
                    aria-label={`Hapus foto ${index + 1}`}
                    onClick={() => setPhotos((current) => current.filter((_, photoIndex) => photoIndex !== index))}
                    className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/75 text-white"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <button
                  type="button"
                  disabled={enhancingIndex !== null || photos.length >= MAX_PHOTOS}
                  onClick={() => void enhancePhoto(index)}
                  className="flex h-9 w-full items-center justify-center gap-1.5 text-[10px] font-semibold text-[#D4AF37] hover:bg-neutral-800 disabled:opacity-40"
                >
                  {enhancingIndex === index ? (
                    <LoaderCircle className="size-3 animate-spin" />
                  ) : (
                    <Sparkles className="size-3" />
                  )}
                  AI Studio Enhance
                </button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-700 bg-neutral-900/50 text-neutral-500 hover:border-[#D4AF37] hover:text-[#D4AF37]">
                {uploadingCount ? (
                  <LoaderCircle className="size-6 animate-spin" />
                ) : (
                  <ImagePlus className="size-6" />
                )}
                <span className="text-xs">{uploadingCount ? "Mengunggah..." : "Tambah foto"}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  disabled={uploadingCount > 0}
                  onChange={(event) => void uploadPhotos(event)}
                  className="sr-only"
                />
              </label>
            )}
          </div>
          <p className="text-[10px] text-neutral-500">JPG, PNG, WebP · maksimal 10 MB per foto · AI menambahkan foto alternatif.</p>
        </fieldset>

        <label className="block space-y-2 text-xs font-medium text-neutral-300">
          Status stok
          <select
            value={stockStatus}
            onChange={(event) => setStockStatus(event.target.value as ProductDocument["stock_status"])}
            className="h-11 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 text-sm text-white outline-none focus:border-[#D4AF37]"
          >
            <option value="in_stock">Tersedia</option>
            <option value="out_of_stock">Habis</option>
          </select>
        </label>

        <Button
          type="submit"
          disabled={isSaving || uploadingCount > 0 || enhancingIndex !== null}
          className="h-12 w-full rounded-xl bg-[#D4AF37] font-semibold text-black hover:bg-[#F3E5AB]"
        >
          {isSaving ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {isSaving ? "Menyimpan..." : "Simpan Produk"}
        </Button>
      </form>
    </main>
  );
}
