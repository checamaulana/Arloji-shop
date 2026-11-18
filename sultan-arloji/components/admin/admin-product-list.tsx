"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ImagePlus, LoaderCircle, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatRupiah } from "@/lib/utils";
import type { ProductDocument } from "@/types/product";

export function AdminProductList() {
  const [products, setProducts] = useState<ProductDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadProducts() {
      try {
        const response = await fetch("/api/products?admin=1", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Produk tidak dapat dimuat.");
        if (active) setProducts(data.products as ProductDocument[]);
      } catch (error) {
        console.error("Could not load products:", error);
        if (active) toast.error(error instanceof Error ? error.message : "Gagal memuat produk.");
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void loadProducts();
    return () => {
      active = false;
    };
  }, []);

  async function deleteProduct(product: ProductDocument) {
    if (!window.confirm(`Hapus produk "${product.name}"?`)) return;
    try {
      const response = await fetch(`/api/products/${encodeURIComponent(product.id)}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Produk tidak dapat dihapus.");
      setProducts((current) => current.filter((item) => item.id !== product.id));
      toast.success("Produk berhasil dihapus.");
    } catch (error) {
      console.error("Could not delete product:", error);
      toast.error(error instanceof Error ? error.message : "Gagal menghapus produk.");
    }
  }

  return (
    <main className="px-5 pb-8 pt-8">
      <header className="mb-6 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#D4AF37]">Katalog</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Barang</h1>
          <p className="mt-1 text-sm text-neutral-400">Kelola produk dan ketersediaan stok.</p>
        </div>
        <Link
          href="/admin/barang/tambah"
          className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-[#D4AF37] px-3 text-xs font-semibold text-black transition-colors hover:bg-[#F3E5AB]"
        >
          <Plus className="size-4" />
          Tambah
        </Link>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-neutral-400">
          <LoaderCircle className="size-4 animate-spin" />
          Memuat produk...
        </div>
      ) : products.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-neutral-800 px-5 py-12 text-center">
          <ImagePlus className="mx-auto size-8 text-neutral-600" />
          <p className="mt-3 text-sm font-medium text-neutral-300">Belum ada produk</p>
          <p className="mt-1 text-xs text-neutral-500">Tambahkan produk pertama ke katalog.</p>
        </section>
      ) : (
        <section className="space-y-3">
          {products.map((product) => (
            <article
              key={product.id}
              className="flex gap-3 rounded-2xl border border-neutral-800 bg-[#171717] p-3"
            >
              <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-neutral-900">
                {product.photos[0] ? (
                  <Image
                    src={product.photos[0]}
                    alt=""
                    fill
                    unoptimized
                    sizes="80px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-neutral-600">
                    <ImagePlus className="size-5" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="line-clamp-2 text-sm font-semibold text-white">{product.name}</h2>
                <p className="mt-1 text-sm font-bold text-[#D4AF37]">{formatRupiah(product.price)}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      product.stock_status === "in_stock"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {product.stock_status === "in_stock" ? "Tersedia" : "Habis"}
                  </span>
                  <span className="text-[10px] text-neutral-500">{product.whatsapp_clicks || 0} minat</span>
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <Link
                  href={`/admin/barang/${encodeURIComponent(product.id)}`}
                  aria-label={`Edit ${product.name}`}
                  className="flex size-9 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-800 hover:text-[#D4AF37]"
                >
                  <Pencil className="size-4" />
                </Link>
                <button
                  type="button"
                  aria-label={`Hapus ${product.name}`}
                  onClick={() => void deleteProduct(product)}
                  className="flex size-9 items-center justify-center rounded-lg text-neutral-500 hover:bg-red-950/60 hover:text-red-400"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
