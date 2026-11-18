"use client";

import { useEffect, useState } from "react";
import { Check, ClipboardList, LoaderCircle, Phone, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
  const [completingOrder, setCompletingOrder] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

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
        if (active) toast.error(error instanceof Error ? error.message : "Gagal memuat pesanan.");
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void loadOrders();
    return () => {
      active = false;
    };
  }, [status, refreshKey]);

  async function completeOrder(orderId: string) {
    setCompletingOrder(orderId);
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Pesanan tidak dapat diperbarui.");
      setOrders((current) => current.filter((order) => order.id !== orderId));
      toast.success("Pesanan dipindahkan ke riwayat.");
    } catch (error) {
      console.error("Could not complete order:", error);
      toast.error(error instanceof Error ? error.message : "Gagal memperbarui pesanan.");
    } finally {
      setCompletingOrder(null);
    }
  }

  return (
    <main className="px-5 pb-8 pt-8">
      <header className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#D4AF37]">Operasional</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Pesanan</h1>
          <p className="mt-1 text-sm text-neutral-400">Kelola transaksi masuk dan riwayatnya.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsLoading(true);
            setRefreshKey((current) => current + 1);
          }}
          aria-label="Muat ulang pesanan"
          className="flex size-10 items-center justify-center rounded-xl border border-neutral-800 text-neutral-400 hover:text-white"
        >
          <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </header>

      <div role="tablist" aria-label="Daftar pesanan" className="mb-5 grid grid-cols-2 rounded-xl border border-neutral-800 bg-neutral-900 p-1">
        {([
          ["active", "Pesanan Masuk"],
          ["completed", "Riwayat"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            id={`orders-tab-${value}`}
            role="tab"
            aria-selected={status === value}
            onClick={() => {
              setIsLoading(true);
              setStatus(value);
            }}
            className={`h-9 rounded-lg text-xs font-semibold transition-colors ${
              status === value ? "bg-[#D4AF37] text-black" : "text-neutral-400 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-neutral-400">
          <LoaderCircle className="size-4 animate-spin" />
          Memuat pesanan...
        </div>
      ) : orders.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-neutral-800 px-5 py-12 text-center">
          <ClipboardList className="mx-auto size-8 text-neutral-600" />
          <p className="mt-3 text-sm font-medium text-neutral-300">
            {status === "active" ? "Belum ada pesanan masuk" : "Belum ada riwayat pesanan"}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            {status === "active" ? "Pesanan baru dari pelanggan akan tampil di sini." : "Pesanan yang selesai akan tersimpan di sini."}
          </p>
        </section>
      ) : (
        <section className="space-y-3">
          {orders.map((order) => {
            const phone = order.customer_phone || "";
            const item = order.item;
            return (
              <article key={order.id} className="rounded-2xl border border-neutral-800 bg-[#171717] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold text-white">{order.customer_name || "Pelanggan"}</h2>
                    <p className="mt-1 text-[10px] text-neutral-500">{formatOrderDate(order.created_at)}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-medium ${
                    status === "active" ? "bg-amber-400/10 text-[#D4AF37]" : "bg-emerald-500/10 text-emerald-400"
                  }`}>
                    {status === "active" ? "Aktif" : "Selesai"}
                  </span>
                </div>

                <div className="mt-4 space-y-3 border-t border-neutral-800 pt-3">
                  {phone && (
                    <a
                      href={`https://wa.me/${formatWhatsAppNumber(phone)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-xs text-emerald-400 hover:text-emerald-300"
                    >
                      <Phone className="size-3.5" />
                      {phone}
                    </a>
                  )}
                  <p className="text-xs leading-relaxed text-neutral-400">
                    {order.delivery_address || "Alamat tidak tersedia"}
                  </p>
                  <div className="rounded-xl bg-neutral-900 p-3">
                    <p className="text-xs font-semibold text-white">
                      {item?.quantity || 1} × {item?.product_name || "Produk"}
                    </p>
                    <p className="mt-1 text-[10px] text-neutral-500">
                      {formatRupiah(item?.price || 0)} per item
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-400">Total</span>
                    <span className="text-sm font-bold text-[#D4AF37]">{formatRupiah(order.total_price)}</span>
                  </div>
                </div>

                {status === "active" && (
                  <Button
                    type="button"
                    disabled={completingOrder === order.id}
                    onClick={() => void completeOrder(order.id)}
                    className="mt-4 h-10 w-full rounded-xl bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-500"
                  >
                    {completingOrder === order.id ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      <Check className="size-4" />
                    )}
                    Tandai Selesai
                  </Button>
                )}
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
