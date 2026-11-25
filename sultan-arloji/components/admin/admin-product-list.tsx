"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ImagePlus, LoaderCircle, Pencil, Plus, Trash2 } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import type { ProductDocument } from "@/types/product";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ProductPhoto } from "@/components/ui/product-photo";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminProductList() {
  const [products, setProducts] = useState<ProductDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reload, setReload] = useState(0);
  const [selected, setSelected] = useState<ProductDocument | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notice, setNotice] = useState<{ text: string; error?: boolean }>();
  const cancelButton = useRef<HTMLButtonElement>(null);
  const deleteTrigger = useRef<HTMLButtonElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const deleting = useRef(false);

  useEffect(() => {
    let active = true;
    async function loadProducts() {
      try {
        const response = await fetch("/api/products?admin=1", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Barang tidak dapat dimuat.");
        if (active) setProducts(data.products as ProductDocument[]);
      } catch (error) {
        console.error("Could not load products:", error);
        if (active) setLoadError(error instanceof Error ? error.message : "Barang tidak dapat dimuat.");
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void loadProducts();
    return () => { active = false; };
  }, [reload]);

  async function deleteProduct() {
    if (!selected || deleting.current) return;
    deleting.current = true;
    setIsDeleting(true);
    setNotice(undefined);
    try {
      const response = await fetch(`/api/products/${encodeURIComponent(selected.id)}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Barang tidak dapat dihapus.");
      setProducts((current) => current.filter((item) => item.id !== selected.id));
      setNotice({ text: "Barang berhasil dihapus." });
    } catch (error) {
      console.error("Could not delete product:", error);
      setNotice({ text: error instanceof Error ? error.message : "Barang tidak dapat dihapus.", error: true });
    } finally {
      deleting.current = false;
      setIsDeleting(false);
      setDialogOpen(false);
    }
  }

  return (
    <div className="page">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 ref={title} tabIndex={-1}>Barang</h1>
        <Link href="/admin/barang/tambah" className="action action-primary"><Plus aria-hidden="true" /> Tambah barang</Link>
      </header>

      <p role="status" className={notice ? `notice mb-3 ${notice.error ? "notice-error" : "notice-success"}` : "sr-only"}>{notice?.text}</p>
      <p role="status" className="sr-only">{isLoading ? "Memuat barang…" : ""}</p>

      <section aria-label="Daftar barang" aria-busy={isLoading}>
        {isLoading ? (
          <div className="card divide-y divide-border" aria-hidden="true">
            {[1, 2, 3].map((row) => <div key={row} className="flex gap-3 p-3"><Skeleton className="size-15 shrink-0 rounded-xl" /><div className="flex-1 space-y-2"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" /></div></div>)}
          </div>
        ) : loadError ? (
          <div className="card space-y-3 p-4">
            <p role="alert" className="notice notice-error">{loadError}</p>
            <button type="button" className="action action-secondary" onClick={() => { setLoadError(""); setIsLoading(true); setReload((value) => value + 1); }}>Muat ulang barang</button>
          </div>
        ) : products.length === 0 ? (
          <div className="card flex flex-col items-center gap-3 px-4 py-8 text-center">
            <span className="icon-tile"><ImagePlus aria-hidden="true" /></span>
            <h2>Belum ada barang</h2>
            <Link href="/admin/barang/tambah" className="action action-primary"><Plus aria-hidden="true" /> Tambah barang</Link>
          </div>
        ) : (
          <div className="card divide-y divide-border">
            {products.map((product) => {
              const available = product.stock_status === "in_stock";
              const removing = isDeleting && selected?.id === product.id;
              return (
                <article key={product.id} className="flex gap-3 p-3" aria-busy={removing}>
                  <div className="relative size-15 shrink-0 overflow-hidden rounded-xl bg-brand-tint">
                    <ProductPhoto src={product.photos?.[0]} alt="" sizes="60px" compact />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base leading-[1.375] font-semibold wrap-anywhere">{product.name}</h2>
                    <p className="mt-1 font-bold wrap-anywhere tabular-nums">{formatRupiah(product.price)}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className={`status-badge ${available ? "status-success" : "status-danger"}`}>{available ? "Tersedia" : "Habis"}</span>
                      <span className="text-xs text-muted-foreground">{product.whatsapp_clicks || 0} minat</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Link href={`/admin/barang/${encodeURIComponent(product.id)}`} aria-label={`Edit ${product.name}`} className="action action-secondary"><Pencil aria-hidden="true" /> Edit</Link>
                      <button
                        type="button"
                        aria-label={`Hapus ${product.name}`}
                        className="action action-danger"
                        disabled={isDeleting}
                        onClick={(event) => {
                          deleteTrigger.current = event.currentTarget;
                          setSelected(product);
                          setDialogOpen(true);
                        }}
                      >
                        {removing ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Trash2 aria-hidden="true" />}
                        {removing ? "Menghapus…" : "Hapus"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <Dialog open={dialogOpen} onOpenChange={(open, details) => {
        if (deleting.current) details.cancel();
        else setDialogOpen(open);
      }}>
        <DialogContent showCloseButton={false} initialFocus={cancelButton} finalFocus={() => deleteTrigger.current?.isConnected ? deleteTrigger.current : title.current}>
          <DialogTitle className="text-lg leading-6 font-bold">Hapus barang secara permanen?</DialogTitle>
          <DialogDescription className="wrap-anywhere"><strong>{selected?.name}</strong> akan dihapus dari database dan katalog toko.</DialogDescription>
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" ref={cancelButton} className="action action-secondary" onClick={() => setDialogOpen(false)} disabled={isDeleting}>Batal</button>
            <button type="button" className="action action-danger-solid" onClick={deleteProduct} disabled={isDeleting}>{isDeleting ? "Menghapus…" : "Hapus barang"}</button>
          </div>
          <span role="status" className="sr-only">{isDeleting ? "Menghapus barang…" : ""}</span>
        </DialogContent>
      </Dialog>
    </div>
  );
}
