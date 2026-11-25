"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Watch, X } from "lucide-react";
import type { ProductDocument } from "@/types/product";
import type { StoreDocument } from "@/types/store";
import { initialStoreData, initialProducts } from "@/lib/data/initial-data";
import { HeaderStore } from "@/components/customer/header-store";
import { ProductCard } from "@/components/customer/product-card";
import { CheckoutDrawer } from "@/components/customer/checkout-drawer";
import { AIChatFloating } from "@/components/customer/ai-chat-floating";
import { Skeleton } from "@/components/ui/skeleton";
import { useChromeSize } from "@/components/ui/design-layout";

export default function CatalogPage() {
  const [store, setStore] = useState<StoreDocument>(initialStoreData);
  const [products, setProducts] = useState<ProductDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ProductDocument | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const orderTrigger = useRef<HTMLButtonElement>(null);
  useChromeSize(searchBarRef, "top");

  useEffect(() => {
    fetch("/api/analytics/track-visit", { method: "POST" }).catch((error) =>
      console.warn("Analytics tracking background warning:", error)
    );
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const [storeResponse, productsResponse] = await Promise.all([
          fetch("/api/store"),
          fetch("/api/products"),
        ]);
        if (storeResponse.ok) {
          const data = await storeResponse.json();
          if (data.store) setStore(data.store);
        }
        if (!productsResponse.ok) {
          setLoadFailed(true);
          return;
        }
        const data = await productsResponse.json();
        setProducts(data.products);
      } catch (error) {
        console.warn("Load catalog warning, using initial data:", error);
        setProducts(initialProducts.map((product, index) => ({ ...product, id: `init-${index}` })));
      } finally {
        setIsLoading(false);
      }
    }
    void loadData();
  }, []);

  const searchResults = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return products.filter((item) => (
      item.name.toLowerCase().includes(query) || item.description?.toLowerCase().includes(query)
    ));
  }, [products, searchQuery]);

  function clearSearch() {
    setSearchQuery("");
    searchRef.current?.focus();
  }

  return (
    <main id="konten" tabIndex={-1} className="app-shell catalog">
      <HeaderStore store={store} />

      <div ref={searchBarRef} className="catalog-search glass gutter space-y-2 border-b border-border py-3">
        <label htmlFor="catalog-search" className="block text-sm font-semibold">Cari jam tangan</label>
        <div className="relative">
          <Search size={20} aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-brand" />
          <input
            id="catalog-search"
            ref={searchRef}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Cari nama atau deskripsi"
            className="field pl-10 pr-12"
          />
          {searchQuery && (
            <button type="button" className="action action-icon action-ghost absolute top-1/2 right-0 -translate-y-1/2" onClick={clearSearch} aria-label="Hapus pencarian">
              <X aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <section className="gutter pt-4" aria-labelledby="catalog-title">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h2 id="catalog-title">Koleksi jam tangan</h2>
          <p className="text-sm text-muted-foreground tabular-nums" role="status">
            {isLoading ? "Memuat katalog…" : loadFailed ? "" : `${searchResults.length} barang`}
          </p>
        </div>
        <div aria-busy={isLoading}>
          {isLoading ? (
            <div className="card divide-y divide-border" aria-hidden="true">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex gap-3 px-3 py-4">
                  <Skeleton className="photo-size aspect-square shrink-0 rounded-xl" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-8 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : loadFailed ? (
            <p className="notice notice-error" role="alert">Katalog tidak dapat dimuat. Muat ulang halaman untuk mencoba lagi.</p>
          ) : searchResults.length ? (
            <div className="card">
              {searchResults.map((product) => (
                <ProductCard key={product.id} product={product} onOrder={(item, trigger) => {
                  orderTrigger.current = trigger;
                  setSelectedProduct(item);
                  setIsDrawerOpen(true);
                }} />
              ))}
            </div>
          ) : (
            <div className="card flex flex-col items-center gap-3 px-4 py-8 text-center">
              <span className="icon-tile"><Watch aria-hidden="true" /></span>
              <h3 className="font-semibold">{products.length ? "Jam tangan tidak ditemukan" : "Belum ada barang di katalog"}</h3>
              {products.length > 0 && <button type="button" className="action action-secondary" onClick={clearSearch}>Reset pencarian</button>}
            </div>
          )}
        </div>
      </section>

      <CheckoutDrawer
        product={selectedProduct}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        returnFocus={orderTrigger}
        storeWhatsappNumber={store.whatsapp_number}
      />
      <AIChatFloating hidden={isDrawerOpen} />
    </main>
  );
}
