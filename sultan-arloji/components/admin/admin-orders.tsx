"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ClipboardList, LoaderCircle, Phone, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRupiah, formatWhatsAppNumber } from "@/lib/utils";
import type { OrderDocument } from "@/types/order";

type OrderStatus = "active" | "completed";

function formatOrderDate(value?: string | null): string {
  if (!value) return "Waktu tidak tersedia";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Waktu tidak tersedia"
    : new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

export function AdminOrders() {
  const [status, setStatus] = useState<OrderStatus>("active");
  const [orders, setOrders] = useState<OrderDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [completingOrder, setCompletingOrder] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ text: string; error?: boolean }>();
  const [refreshKey, setRefreshKey] = useState(0);
  const title = useRef<HTMLHeadingElement>(null);
  const pendingOrder = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadOrders() {
      try {
        const response = await fetch(`/api/orders?status=${status}`, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Pesanan tidak dapat dimuat.");
        if (active) setOrders(data.orders as OrderDocument[]);
      } catch (error) {
        console.error("Could not load orders:", error);
        if (active) setLoadError(error instanceof Error ? error.message : "Pesanan tidak dapat dimuat.");
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void loadOrders();
    return () => { active = false; };
  }, [status, refreshKey]);

  function reload() {
    setLoadError("");
    setNotice(undefined);
    setIsLoading(true);
    setRefreshKey((value) => value + 1);
  }

  async function completeOrder(orderId: string) {
    if (pendingOrder.current) return;
    pendingOrder.current = orderId;
    setCompletingOrder(orderId);
    setNotice(undefined);
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Pesanan tidak dapat diperbarui.");
      setOrders((current) => current.filter((order) => order.id !== orderId));
      setNotice({ text: "Pesanan dipindahkan ke riwayat." });
      title.current?.focus();
    } catch (error) {
      console.error("Could not complete order:", error);
      setNotice({ text: error instanceof Error ? error.message : "Gagal memperbarui pesanan.", error: true });
    } finally {
      pendingOrder.current = null;
      setCompletingOrder(null);
    }
  }

  function renderOrders() {
    if (isLoading) {
      return <div className="card space-y-3 p-4" aria-hidden="true"><Skeleton className="h-5 w-1/2" /><Skeleton className="h-4 w-2/3" /><Skeleton className="h-16 w-full" /></div>;
    }
    if (loadError) return <p role="alert" className="notice notice-error">{loadError}</p>;
    if (!orders.length) {
      return (
        <div className="card flex flex-col items-center gap-3 px-4 py-8 text-center">
          <span className="icon-tile"><ClipboardList aria-hidden="true" /></span>
          <h2>{status === "active" ? "Belum ada pesanan masuk" : "Belum ada riwayat pesanan"}</h2>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {orders.map((order) => {
          const phone = order.customer_phone || "";
          const item = order.item;
          const updating = completingOrder === order.id;
          return (
            <article key={order.id} className="card p-4" aria-busy={updating}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold wrap-anywhere">{order.customer_name || "Pelanggan"}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{formatOrderDate(order.created_at)}</p>
                </div>
                <span className={`status-badge ${status === "active" ? "status-warning" : "status-success"}`}>{status === "active" ? "Aktif" : "Selesai"}</span>
              </div>

              <div className="mt-3 space-y-3 border-t border-border pt-3">
                {phone && (
                  <a href={`https://wa.me/${formatWhatsAppNumber(phone)}`} target="_blank" rel="noreferrer" className="action action-secondary max-w-full wrap-anywhere" aria-label={`WhatsApp ${phone}`}>
                    <Phone aria-hidden="true" /> {phone}
                  </a>
                )}
                <p className="text-sm leading-5 wrap-anywhere text-muted-foreground">{order.delivery_address || "Alamat tidak tersedia"}</p>
                <div className="rounded-xl bg-canvas p-3">
                  <p className="text-sm font-semibold wrap-anywhere tabular-nums">{item?.quantity || 1} × {item?.product_name || "Produk"}</p>
                  <p className="mt-1 text-sm text-muted-foreground tabular-nums">{formatRupiah(item?.price || 0)} per item</p>
                </div>
                <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-lg font-bold wrap-anywhere tabular-nums">{formatRupiah(order.total_price)}</p>
                </div>
              </div>

              {status === "active" && (
                <button type="button" className="action action-primary mt-4 w-full" disabled={!!completingOrder} onClick={() => void completeOrder(order.id)}>
                  {updating ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Check aria-hidden="true" />}
                  {updating ? "Memperbarui…" : "Tandai selesai"}
                </button>
              )}
            </article>
          );
        })}
      </div>
    );
  }

  return (
    <div className="page">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 ref={title} tabIndex={-1}>Pesanan</h1>
        <button type="button" className="action action-secondary action-icon" aria-label="Muat ulang pesanan" onClick={reload} disabled={isLoading || !!completingOrder}><RefreshCw aria-hidden="true" className={isLoading ? "animate-spin" : undefined} /></button>
      </header>

      <Tabs value={status} onValueChange={(value) => {
        if ((value !== "active" && value !== "completed") || value === status || pendingOrder.current) return;
        setLoadError("");
        setNotice(undefined);
        setIsLoading(true);
        setStatus(value);
      }}>
        <TabsList activateOnFocus aria-label="Daftar pesanan" className="!grid !h-auto !w-full grid-cols-2 border border-border bg-surface p-1">
          <TabsTrigger value="active" className="min-h-11 whitespace-normal data-active:bg-brand-tint data-active:font-bold data-active:text-brand">Pesanan masuk</TabsTrigger>
          <TabsTrigger value="completed" className="min-h-11 whitespace-normal data-active:bg-brand-tint data-active:font-bold data-active:text-brand">Riwayat</TabsTrigger>
        </TabsList>
        <p role="status" className={notice ? `notice mt-1 ${notice.error ? "notice-error" : "notice-success"}` : "sr-only"}>
          {notice?.text || (isLoading ? "Memuat pesanan…" : completingOrder ? "Memperbarui pesanan…" : "")}
        </p>
        {(["active", "completed"] as const).map((value) => (
          <TabsContent key={value} value={value} className="mt-2" aria-busy={isLoading}>{status === value && renderOrders()}</TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
