"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { ClipboardCheck, Eye, Package, Share2, ShoppingBag, Store } from "lucide-react";
import { toast } from "sonner";
import type { ProductDocument } from "@/types/product";
import type { OrderDocument } from "@/types/order";

const RANGES = [
  { value: "today", label: "Hari ini" },
  { value: "7d", label: "7 hari" },
  { value: "30d", label: "30 hari" },
  { value: "all", label: "Semua" },
] as const;

export function AdminDashboard() {
  const [range, setRange] = useState<(typeof RANGES)[number]["value"]>("today");
  const [activeOrders, setActiveOrders] = useState(0);
  const [activeProducts, setActiveProducts] = useState(0);
  const [visitors, setVisitors] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const storeUrl = useSyncExternalStore(
    () => () => {},
    () => `${window.location.origin}/`,
    () => ""
  );

  useEffect(() => {
    let active = true;
    async function loadMetrics() {
      try {
        const [ordersResponse, productsResponse, statsResponse] = await Promise.all([
          fetch("/api/orders?status=active", { cache: "no-store" }),
          fetch("/api/products?admin=1", { cache: "no-store" }),
          fetch(`/api/analytics/stats?range=${range}`, { cache: "no-store" }),
        ]);

        if (!ordersResponse.ok || !productsResponse.ok || !statsResponse.ok) {
          throw new Error("Salah satu metrik dashboard gagal dimuat.");
        }

        const [ordersData, productsData, statsData] = await Promise.all([
          ordersResponse.json(),
          productsResponse.json(),
          statsResponse.json(),
        ]);
        if (!active) return;
        const products = productsData.products as ProductDocument[];
        setActiveOrders((ordersData.orders as OrderDocument[]).length);
        setActiveProducts(products.filter((product) => product.stock_status === "in_stock").length);
        setVisitors(Number(statsData.pageviews) || 0);
      } catch (error) {
        console.error("Could not load admin metrics:", error);
        if (active) toast.error("Gagal memuat metrik dashboard.");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadMetrics();
    return () => {
      active = false;
    };
  }, [range]);

  async function copyStoreLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/`);
      toast.success("Link toko berhasil disalin.");
    } catch (error) {
      console.error("Could not copy store link:", error);
      toast.error("Gagal menyalin link toko.");
    }
  }

  async function shareStoreLink() {
    const url = `${window.location.origin}/`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Sultan Arloji", url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("Could not share store link:", error);
      }
    }
    await copyStoreLink();
  }

  const metrics = [
    { label: "Pesanan masuk", value: activeOrders, icon: ShoppingBag },
    { label: "Produk tersedia", value: activeProducts, icon: Package },
    { label: `Pengunjung · ${RANGES.find((item) => item.value === range)?.label}`, value: visitors, icon: Eye },
  ];

  return (
    <main className="px-5 pb-8 pt-8">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#D4AF37]">
          Panel Admin
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Beranda</h1>
        <p className="mt-1 text-sm text-neutral-400">Ringkasan aktivitas toko kamu.</p>
      </header>

      <section className="mb-6 rounded-2xl border border-[#D4AF37]/30 bg-gradient-to-br from-[#211d10] to-[#171717] p-4">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/15 text-[#D4AF37]">
            <Store className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-white">Link Toko Online</h2>
            <p className="mt-1 break-all text-xs text-neutral-400">{storeUrl}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={copyStoreLink}
            className="flex h-10 items-center justify-center gap-2 rounded-xl bg-[#D4AF37] text-xs font-semibold text-black transition-colors hover:bg-[#F3E5AB]"
          >
            <ClipboardCheck className="size-4" />
            Salin link
          </button>
          <button
            type="button"
            onClick={() => void shareStoreLink()}
            className="flex h-10 items-center justify-center gap-2 rounded-xl border border-neutral-700 bg-neutral-900/70 text-xs font-semibold text-neutral-200 transition-colors hover:border-neutral-500"
          >
            <Share2 className="size-4" />
            Bagikan
          </button>
        </div>
      </section>

      <section className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Ringkasan</h2>
        <label className="sr-only" htmlFor="visitor-range">Rentang pengunjung</label>
        <select
          id="visitor-range"
          value={range}
          onChange={(event) => {
            setIsLoading(true);
            setRange(event.target.value as typeof range);
          }}
          className="rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-2 text-xs text-neutral-300 outline-none focus:border-[#D4AF37]"
        >
          {RANGES.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
      </section>

      <section className="grid grid-cols-2 gap-3">
        {metrics.map(({ label, value, icon: Icon }) => (
          <article key={label} className="rounded-2xl border border-neutral-800 bg-[#171717] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-400">{label}</span>
              <Icon className="size-4 text-[#D4AF37]" />
            </div>
            <p className="mt-4 text-2xl font-semibold text-white">
              {isLoading ? "…" : value === null ? "—" : value.toLocaleString("id-ID")}
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}
