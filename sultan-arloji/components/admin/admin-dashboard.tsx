"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Copy, Eye, Package, Share2, ShoppingBag, Store, type LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProductDocument } from "@/types/product";
import type { OrderDocument } from "@/types/order";

const RANGES = [
  { value: "today", label: "Hari ini" },
  { value: "7d", label: "7 hari" },
  { value: "30d", label: "30 hari" },
  { value: "all", label: "Semua" },
] as const;

const subscribe = () => () => {};
const getStoreUrl = () => `${window.location.origin}/`;

async function fetchMetric(url: string, select: (data: unknown) => number): Promise<number | null> {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return select(await response.json());
  } catch (error) {
    console.error("Could not load dashboard metric:", url, error);
    return null;
  }
}

function MetricValue({ value }: { value: number | null | undefined }) {
  if (value === undefined) {
    return <Skeleton className="mt-2 h-8 w-14" aria-hidden="true" />;
  }

  return (
    <>
      <p className="mt-2 text-[1.75rem] leading-8 font-bold wrap-anywhere tabular-nums">{value === null ? "—" : value.toLocaleString("id-ID")}</p>
      {value === null && <p className="mt-1 text-sm text-muted-foreground">Data tidak tersedia</p>}
    </>
  );
}

function MetricCard({ label, icon: Icon, value }: { label: string; icon: LucideIcon; value: number | null | undefined }) {
  return (
    <article className="card min-w-0 p-3" aria-busy={value === undefined}>
      <span className="icon-tile"><Icon aria-hidden="true" /></span>
      <h3 className="mt-2 text-sm font-semibold wrap-anywhere text-muted-foreground">{label}</h3>
      <MetricValue value={value} />
    </article>
  );
}

export function AdminDashboard() {
  const [range, setRange] = useState<(typeof RANGES)[number]["value"]>("today");
  const [activeOrders, setActiveOrders] = useState<number | null>();
  const [activeProducts, setActiveProducts] = useState<number | null>();
  const [visitors, setVisitors] = useState<number | null>();
  const [linkStatus, setLinkStatus] = useState<{ text: string; error?: boolean }>();
  const storeUrl = useSyncExternalStore(subscribe, getStoreUrl, () => "");

  useEffect(() => {
    let active = true;
    void fetchMetric("/api/orders?status=active", (data) => (data as { orders: OrderDocument[] }).orders.length)
      .then((value) => { if (active) setActiveOrders(value); });
    void fetchMetric("/api/products?admin=1", (data) => (data as { products: ProductDocument[] }).products.filter((product) => product.stock_status === "in_stock").length)
      .then((value) => { if (active) setActiveProducts(value); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    void fetchMetric(`/api/analytics/stats?range=${range}`, (data) => {
      const value = (data as { pageviews?: number }).pageviews;
      if (typeof value !== "number" || !Number.isFinite(value)) throw new Error("Jumlah kunjungan tidak tersedia.");
      return value;
    }).then((value) => { if (active) setVisitors(value); });
    return () => { active = false; };
  }, [range]);

  async function copyStoreLink() {
    try {
      await navigator.clipboard.writeText(getStoreUrl());
      setLinkStatus({ text: "Link toko berhasil disalin." });
    } catch (error) {
      console.error("Could not copy store link:", error);
      setLinkStatus({ text: "Gagal menyalin link toko.", error: true });
    }
  }

  async function shareStoreLink() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Sultan Arloji", url: getStoreUrl() });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("Could not share store link:", error);
      }
    }
    await copyStoreLink();
  }

  const loadingLabel = activeOrders === undefined || activeProducts === undefined || visitors === undefined;

  return (
    <div className="page space-y-5">
      <h1>Beranda</h1>

      <section className="on-brand rounded-3xl p-4 shadow-sm" aria-labelledby="store-link-title">
        <div className="flex items-start gap-3">
          <span className="icon-tile bg-white/15 text-yellow-action"><Store aria-hidden="true" /></span>
          <div className="min-w-0">
            <h2 id="store-link-title">Link toko online</h2>
            <p className="mt-1 text-sm wrap-anywhere">{storeUrl}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="action action-primary flex-1" onClick={copyStoreLink}><Copy aria-hidden="true" /> Salin link</button>
          <button type="button" className="action action-on-brand flex-1" onClick={shareStoreLink}><Share2 aria-hidden="true" /> Bagikan</button>
        </div>
        <p role="status" className={linkStatus ? `notice mt-3 ${linkStatus.error ? "notice-error" : "notice-success"}` : "sr-only"}>{linkStatus?.text}</p>
      </section>

      <section aria-labelledby="summary-title">
        <h2 id="summary-title" className="mb-3">Ringkasan</h2>
        <p role="status" className="sr-only">{loadingLabel ? "Memuat ringkasan…" : ""}</p>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,132px),1fr))] gap-3">
          <MetricCard label="Pesanan masuk" icon={ShoppingBag} value={activeOrders} />
          <MetricCard label="Produk tersedia" icon={Package} value={activeProducts} />
          <article className="card col-span-full p-3" aria-busy={visitors === undefined}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="icon-tile"><Eye aria-hidden="true" /></span>
                <h3 className="text-sm font-semibold wrap-anywhere text-muted-foreground">Pengunjung</h3>
              </div>
              <label className="sr-only" htmlFor="visitor-range">Rentang pengunjung</label>
              <select id="visitor-range" value={range} onChange={(event) => {
                setVisitors(undefined);
                setRange(event.target.value as typeof range);
              }} className="field w-auto max-w-full">
                {RANGES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </div>
            <MetricValue value={visitors} />
          </article>
        </div>
      </section>
    </div>
  );
}
