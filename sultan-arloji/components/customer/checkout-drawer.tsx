"use client";

import React, { useState, useMemo } from "react";
import { ProductDocument } from "@/types/product";
import { formatRupiah, formatWhatsAppNumber } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Minus,
  MessageSquare,
  X,
  Phone,
  User,
  MapPin,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface CheckoutDrawerProps {
  product: ProductDocument | null;
  isOpen: boolean;
  onClose: () => void;
  storeWhatsappNumber?: string;
  onOrderSuccess?: () => void;
}

export function CheckoutDrawer({
  product,
  isOpen,
  onClose,
  storeWhatsappNumber = "6281234567890",
  onOrderSuccess,
}: CheckoutDrawerProps) {
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when drawer opens for a new product
  React.useEffect(() => {
    if (isOpen) {
      setQuantity(1);
    }
  }, [isOpen, product?.id]);

  if (!product) return null;

  const itemTotal = product.price * quantity;

  // Generate dynamic WhatsApp Message text
  const messagePreview = useMemo(() => {
    const formattedPhone = customerPhone.trim()
      ? `+62 ${customerPhone.replace(/^0+/, "").trim()}`
      : "[Nomor WhatsApp kamu]";

    return `Halo kak, mau pesan:

${quantity}x ${product.name} — ${formatRupiah(itemTotal)}

Total: ${formatRupiah(itemTotal)}

Nama: ${customerName.trim() || "[Nama kamu]"}
No WA: ${formattedPhone}
Alamat: ${deliveryAddress.trim() || "[Alamat / Area pengiriman]"}`;
  }, [product.name, quantity, itemTotal, customerName, customerPhone, deliveryAddress]);

  const handleCheckout = async () => {
    if (!customerName.trim()) {
      toast.error("Silakan isi nama kamu terlebih dahulu.");
      return;
    }
    if (!customerPhone.trim()) {
      toast.error("Silakan isi nomor WhatsApp kamu.");
      return;
    }
    if (!deliveryAddress.trim()) {
      toast.error("Silakan isi alamat atau area pengiriman.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Record order and increment whatsapp_clicks via backend API
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customerName.trim(),
          customer_phone: formatWhatsAppNumber(customerPhone.trim()),
          delivery_address: deliveryAddress.trim(),
          item: {
            product_id: product.id,
            product_name: product.name,
            price: product.price,
            quantity: quantity,
            photo_url: product.photos?.[0] || "",
          },
          total_price: itemTotal,
        }),
      });

      if (!response.ok) {
        console.warn("API Pesanan merespons status non-ok, tetap mengalihkan ke WhatsApp...");
      }

      toast.success("Mengarahkan ke WhatsApp admin...");
      onOrderSuccess?.();

      // Form WhatsApp destination URL
      const cleanStorePhone = formatWhatsAppNumber(storeWhatsappNumber);
      const encodedMessage = encodeURIComponent(messagePreview);
      const waUrl = `https://wa.me/${cleanStorePhone}?text=${encodedMessage}`;

      // Short delay for toast visibility before navigating
      setTimeout(() => {
        window.open(waUrl, "_blank");
        setIsSubmitting(false);
        onClose();
      }, 500);
    } catch (err) {
      console.error("Gagal mencatat pesanan:", err);
      // Even if API fails, still provide WhatsApp fallback to avoid losing the lead
      const cleanStorePhone = formatWhatsAppNumber(storeWhatsappNumber);
      const encodedMessage = encodeURIComponent(messagePreview);
      window.open(`https://wa.me/${cleanStorePhone}?text=${encodedMessage}`, "_blank");
      setIsSubmitting(false);
      onClose();
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-w-md mx-auto bg-[#141414] border-t border-neutral-800 text-neutral-100 rounded-t-3xl max-h-[90vh] overflow-y-auto">
        {/* Header Drawer */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-neutral-800/80 bg-[#141414]/95 px-5 py-4 backdrop-blur-md">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-[#D4AF37] uppercase">
              Konfirmasi Pesanan
            </span>
            <DrawerTitle className="text-base font-bold text-white">
              PESANANMU
            </DrawerTitle>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="size-8 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Item Details Box */}
          <div className="flex gap-3.5 rounded-2xl bg-neutral-900/90 border border-neutral-800/80 p-3">
            <div className="size-16 shrink-0 rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800">
              <img
                src={product.photos?.[0] || "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=300"}
                alt={product.name}
                className="size-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-semibold text-white line-clamp-1">
                  {product.name}
                </h3>
                <p className="text-xs font-bold text-[#D4AF37] mt-0.5">
                  {formatRupiah(product.price)}
                </p>
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-800/60">
                <span className="text-[11px] text-neutral-400">Jumlah:</span>
                <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 px-2 py-0.5 rounded-full">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="size-5 rounded-full flex items-center justify-center text-neutral-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <Minus className="size-3" />
                  </button>
                  <span className="text-xs font-bold w-4 text-center text-white">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="size-5 rounded-full flex items-center justify-center text-neutral-300 hover:text-white"
                  >
                    <Plus className="size-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Form Input Data Customer */}
          <div className="space-y-3">
            <label className="text-[11px] font-bold tracking-wider text-neutral-300 uppercase">
              Data Penerima
            </label>

            {/* Nama */}
            <div>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-500" />
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nama lengkap kamu (contoh: Wati Lestari)"
                  className="pl-9 bg-neutral-900 border-neutral-800 text-xs text-white placeholder:text-neutral-500 rounded-xl focus-visible:border-[#D4AF37]"
                />
              </div>
            </div>

            {/* Nomor WA */}
            <div>
              <div className="flex rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900 focus-within:border-[#D4AF37]">
                <div className="flex items-center gap-1 bg-neutral-800/80 px-3 text-xs font-semibold text-neutral-300 border-r border-neutral-800">
                  <span>ID +62</span>
                </div>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="812 3456 7890"
                  className="w-full bg-transparent px-3 py-2 text-xs text-white placeholder:text-neutral-500 outline-none"
                />
              </div>
            </div>

            {/* Alamat */}
            <div>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 size-4 text-neutral-500" />
                <textarea
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  rows={2}
                  placeholder="Alamat lengkap / Kota / Area (contoh: Kemang, Jakarta Selatan)"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900 pl-9 pr-3 py-2 text-xs text-white placeholder:text-neutral-500 outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>
          </div>

          {/* Dynamic WhatsApp Preview Box */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <MessageSquare className="size-3.5 text-[#25D366]" />
              <span className="text-[11px] font-semibold text-neutral-300">
                Pesan dari WhatsApp kamu:
              </span>
            </div>
            <div className="rounded-2xl border border-neutral-800/80 bg-neutral-950 p-3 text-[11px] font-mono text-neutral-300 whitespace-pre-wrap leading-relaxed shadow-inner">
              {messagePreview}
            </div>
          </div>

          {/* Bottom Total & Checkout Button */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="text-neutral-400">Total Pembayaran:</span>
              <span className="text-base font-bold text-[#D4AF37]">
                {formatRupiah(itemTotal)}
              </span>
            </div>

            <Button
              onClick={handleCheckout}
              disabled={isSubmitting}
              className="w-full h-12 rounded-full bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Memproses Pesanan...</span>
                </>
              ) : (
                <>
                  <Phone className="size-4 fill-white" />
                  <span>Kirim ke WhatsApp</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
