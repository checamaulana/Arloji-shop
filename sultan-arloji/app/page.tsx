"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ProductDocument } from "@/types/product";
import { StoreDocument } from "@/types/store";
import { initialStoreData, initialProducts } from "@/lib/data/initial-data";
import { HeaderStore } from "@/components/customer/header-store";
import { ProductCard } from "@/components/customer/product-card";
import { CheckoutDrawer } from "@/components/customer/checkout-drawer";
import { AIChatFloating } from "@/components/customer/ai-chat-floating";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Flame, Watch, SlidersHorizontal } from "lucide-react";

const BRAND_FILTERS = ["Semua", "Rolex", "Patek", "Audemars", "Hublot"];

export default function CatalogPage() {
  const [store, setStore] = useState<StoreDocument>(initialStoreData);
  const [products, setProducts] = useState<ProductDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("Semua");
  const [selectedProduct, setSelectedProduct] = useState<ProductDocument | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // 1. Trigger visit tracking once on mount
  useEffect(() => {
    fetch("/api/analytics/track-visit", { method: "POST" }).catch((err) =>
      console.warn("Analytics tracking background warning:", err)
    );
  }, []);

  // 2. Load store profile and products
  useEffect(() => {
    async function loadData() {
      try {
        const [storeRes, productsRes] = await Promise.all([
          fetch("/api/store"),
          fetch("/api/products"),
        ]);

        if (storeRes.ok) {
          const storeData = await storeRes.json();
          if (storeData.store) {
            setStore(storeData.store);
          }
        }

        if (productsRes.ok) {
          const productsData = await productsRes.json();
          if (productsData.products && productsData.products.length > 0) {
            setProducts(productsData.products);
          } else {
            // Fallback to initial products with ids
            setProducts(
              initialProducts.map((p, i) => ({ ...p, id: `init-${i}` }))
            );
          }
        }
      } catch (err) {
        console.warn("Load catalog warning, using initial data:", err);
        setProducts(
          initialProducts.map((p, i) => ({ ...p, id: `init-${i}` }))
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // Filter products by search and brand
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description &&
          item.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchBrand =
        selectedBrand === "Semua" ||
        item.name.toLowerCase().includes(selectedBrand.toLowerCase());

      return matchSearch && matchBrand;
    });
  }, [products, searchQuery, selectedBrand]);

  const handleOpenOrder = (product: ProductDocument) => {
    setSelectedProduct(product);
    setIsDrawerOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col pb-24">
      {/* 1. Header Profil Toko Sultan Arloji */}
      <HeaderStore store={store} />

      {/* 2. Search Bar & Brand Filter */}
      <div className="sticky top-0 z-30 bg-[#0B0B0B]/95 backdrop-blur-md px-4 py-3 border-b border-neutral-800/80 space-y-2.5">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari Rolex, Patek Philippe, Audemars..."
            className="w-full h-10 rounded-xl bg-neutral-900 border border-neutral-800 pl-10 pr-4 text-xs text-white placeholder:text-neutral-500 outline-none focus:border-[#D4AF37] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs px-1"
            >
              ✕
            </button>
          )}
        </div>

        {/* Brand Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {BRAND_FILTERS.map((brand) => {
            const isSelected = selectedBrand === brand;
            return (
              <button
                key={brand}
                onClick={() => setSelectedBrand(brand)}
                className={`shrink-0 rounded-full px-3.5 py-1 text-xs font-medium transition-all active:scale-95 ${
                  isSelected
                    ? "bg-[#D4AF37] text-black shadow-md shadow-amber-500/20 font-semibold"
                    : "bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white hover:border-neutral-700"
                }`}
              >
                {brand}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Section Title & Catalog List */}
      <div className="px-4 pt-4 flex-1">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-1.5">
            <Flame className="size-4 text-[#D4AF37]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
              Koleksi Jam Tangan ({filteredProducts.length})
            </h2>
          </div>
          <span className="text-[11px] text-[#D4AF37] font-medium">
            100% Original Guaranteed
          </span>
        </div>

        {/* Loading Skeletons */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-neutral-800 bg-[#171717] p-3 space-y-3"
              >
                <Skeleton className="aspect-square w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-4 w-1/3 rounded" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="space-y-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onOrder={handleOpenOrder}
              />
            ))}
          </div>
        ) : (
          /* Empty Search State */
          <div className="py-16 text-center space-y-3">
            <div className="size-14 mx-auto rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-500">
              <Watch className="size-6 text-neutral-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                Jam tangan tidak ditemukan
              </p>
              <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
                Silakan coba kata kunci lain atau hubungi asisten butik kami untuk request model khusus.
              </p>
            </div>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedBrand("Semua");
              }}
              className="text-xs text-[#D4AF37] underline underline-offset-4 hover:text-[#F3E5AB]"
            >
              Reset Pencarian
            </button>
          </div>
        )}
      </div>

      {/* 4. Checkout Drawer (WhatsApp Order Flow) */}
      <CheckoutDrawer
        product={selectedProduct}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        storeWhatsappNumber={store.whatsapp_number}
      />

      {/* 5. Floating AI Concierge Chatbot */}
      <AIChatFloating />
    </div>
  );
}
