"use client";

import { useRef, useState, type FormEvent, type RefObject } from "react";
import { Loader2, MessageSquare, Minus, Plus, X } from "lucide-react";
import type { ProductDocument } from "@/types/product";
import { formatRupiah, formatWhatsAppNumber } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ProductPhoto } from "@/components/ui/product-photo";
import { useSheetViewport } from "@/components/ui/design-layout";

type CustomerField = "name" | "phone" | "address";

export function CheckoutDrawer({
  product,
  isOpen,
  onClose,
  returnFocus,
  storeWhatsappNumber = "6281234567890",
}: {
  product: ProductDocument | null;
  isOpen: boolean;
  onClose: () => void;
  returnFocus: RefObject<HTMLButtonElement | null>;
  storeWhatsappNumber?: string;
}) {
  const [quantity, setQuantity] = useState(1);
  const [customer, setCustomer] = useState({ name: "", phone: "", address: "" });
  const [errors, setErrors] = useState<Partial<Record<CustomerField, string>>>({});
  const [phase, setPhase] = useState<"idle" | "submitting" | "redirecting">("idle");
  const [whatsappLink, setWhatsappLink] = useState("");
  const closeButton = useRef<HTMLButtonElement>(null);
  const submitting = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const retryLink = useRef<HTMLAnchorElement>(null);
  const busy = phase !== "idle";
  useSheetViewport(isOpen);

  if (!product) return null;
  const itemTotal = product.price * quantity;
  const formattedPhone = customer.phone.trim()
    ? `+62 ${customer.phone.replace(/^0+/, "").trim()}`
    : "[Nomor WhatsApp kamu]";
  const messagePreview = `Halo kak, mau pesan:

${quantity}x ${product.name} — ${formatRupiah(itemTotal)}

Total: ${formatRupiah(itemTotal)}

Nama: ${customer.name.trim() || "[Nama kamu]"}
No WA: ${formattedPhone}
Alamat: ${customer.address.trim() || "[Alamat / Area pengiriman]"}`;

  function changeField(field: CustomerField, value: string) {
    setCustomer((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function close() {
    if (!submitting.current) onClose();
  }

  async function handleCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!product || submitting.current || whatsappLink) return;

    const validation: Partial<Record<CustomerField, string>> = {};
    if (!customer.name.trim()) validation.name = "Isi nama kamu terlebih dahulu.";
    if (!customer.phone.trim()) validation.phone = "Isi nomor WhatsApp kamu.";
    if (!customer.address.trim()) validation.address = "Isi alamat atau area pengiriman.";
    setErrors(validation);
    const firstInvalid = Object.keys(validation)[0];
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }

    submitting.current = true;
    setPhase("submitting");
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customer.name.trim(),
          customer_phone: formatWhatsAppNumber(customer.phone.trim()),
          delivery_address: customer.address.trim(),
          item: {
            product_id: product.id,
            product_name: product.name,
            price: product.price,
            quantity,
            photo_url: product.photos?.[0] || "",
          },
          total_price: itemTotal,
        }),
      });
      if (!response.ok) console.warn("Pencatatan pesanan gagal. Melanjutkan ke WhatsApp.");
    } catch (error) {
      console.error("Gagal mencatat pesanan:", error);
    }

    setPhase("redirecting");
    const url = `https://wa.me/${formatWhatsAppNumber(storeWhatsappNumber)}?text=${encodeURIComponent(messagePreview)}`;
    window.setTimeout(() => {
      const popup = window.open(url, "_blank");
      if (popup) popup.opener = null;
      submitting.current = false;
      setPhase("idle");
      if (popup) onClose();
      else {
        setWhatsappLink(url);
        requestAnimationFrame(() => retryLink.current?.focus());
      }
    }, 500);
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open, details) => {
        if (open) return;
        if (submitting.current) details.cancel();
        else close();
      }}
      onOpenChangeComplete={(open) => {
        if (open) return;
        setQuantity(1);
        setErrors({});
        setWhatsappLink("");
      }}
    >
      <DialogContent sheet showCloseButton={false} initialFocus={closeButton} finalFocus={returnFocus}>
        <div className="gutter flex shrink-0 items-center justify-between gap-2 border-b border-border py-2">
          <DialogTitle className="text-lg leading-6 font-bold">Konfirmasi pesanan</DialogTitle>
          <button type="button" ref={closeButton} className="action action-ghost action-icon" onClick={close} disabled={busy} aria-label="Tutup">
            <X aria-hidden="true" />
          </button>
        </div>

        <form ref={formRef} onSubmit={handleCheckout} noValidate className="checkout-form">
          <div className="checkout-fields sheet-scroll gutter min-h-0 space-y-4 py-4">
            <div className="rounded-2xl border border-border bg-canvas p-3">
              <div className="flex items-start gap-3">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-brand-tint">
                  <ProductPhoto key={product.id} src={product.photos?.[0]} alt={product.name} sizes="64px" compact />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold wrap-anywhere">{product.name}</p>
                  <p className="mt-1 font-bold wrap-anywhere tabular-nums">{formatRupiah(product.price)} <span className="text-sm font-normal text-muted-foreground">per unit</span></p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2">
                <span className="text-sm font-semibold">Jumlah</span>
                <div role="group" aria-label="Jumlah barang" className="flex items-center gap-2">
                  <button type="button" className="action action-secondary action-icon" aria-label="Kurangi jumlah" onClick={() => setQuantity((value) => Math.max(1, value - 1))} disabled={quantity <= 1 || busy || !!whatsappLink}><Minus aria-hidden="true" /></button>
                  <output aria-label="Jumlah" className="min-w-6 text-center font-bold tabular-nums">{quantity}</output>
                  <button type="button" className="action action-secondary action-icon" aria-label="Tambah jumlah" onClick={() => setQuantity((value) => value + 1)} disabled={busy || !!whatsappLink}><Plus aria-hidden="true" /></button>
                </div>
              </div>
            </div>

            <fieldset disabled={busy || !!whatsappLink} className="space-y-3">
              <label className="field-label" htmlFor="checkout-name">Nama
                <input id="checkout-name" name="name" required autoComplete="name" className="field" value={customer.name} onChange={(event) => changeField("name", event.target.value)} aria-invalid={!!errors.name} aria-describedby={errors.name ? "checkout-name-error" : undefined} />
                {errors.name && <span className="field-error" id="checkout-name-error">{errors.name}</span>}
              </label>
              <label className="field-label" htmlFor="checkout-phone">Nomor WhatsApp
                <span className="flex items-center gap-2">
                  <span className="shrink-0 rounded-xl bg-brand-tint px-2 py-3 whitespace-nowrap text-brand" aria-hidden="true">ID +62</span>
                  <input id="checkout-phone" name="phone" required type="tel" autoComplete="tel-national" placeholder="812 3456 7890" className="field" value={customer.phone} onChange={(event) => changeField("phone", event.target.value)} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "checkout-phone-error" : undefined} />
                </span>
                {errors.phone && <span className="field-error" id="checkout-phone-error">{errors.phone}</span>}
              </label>
              <label className="field-label" htmlFor="checkout-address">Alamat atau area pengiriman
                <textarea id="checkout-address" name="address" required rows={2} autoComplete="street-address" className="field" value={customer.address} onChange={(event) => changeField("address", event.target.value)} aria-invalid={!!errors.address} aria-describedby={errors.address ? "checkout-address-error" : undefined} />
                {errors.address && <span className="field-error" id="checkout-address-error">{errors.address}</span>}
              </label>
            </fieldset>

            <section aria-labelledby="whatsapp-preview">
              <h3 id="whatsapp-preview" className="mb-2 flex items-center gap-2 text-sm font-semibold"><MessageSquare size={18} className="text-brand" aria-hidden="true" /> Pratinjau pesan WhatsApp</h3>
              <p className="rounded-xl border border-border bg-canvas p-3 text-sm leading-5 wrap-anywhere whitespace-pre-wrap">{messagePreview}</p>
            </section>
          </div>

          <div className="sheet-footer gutter space-y-2 border-t border-border bg-surface pt-3">
            <div className="flex flex-wrap items-baseline justify-between gap-x-2">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-lg font-bold wrap-anywhere tabular-nums">{formatRupiah(itemTotal)}</p>
            </div>
            {whatsappLink ? (
              <a ref={retryLink} className="action action-primary w-full" href={whatsappLink} target="_blank" rel="noreferrer" onClick={close}>Buka WhatsApp</a>
            ) : (
              <button type="submit" disabled={busy} className="action action-primary w-full">
                {busy && <Loader2 className="animate-spin" aria-hidden="true" />}
                {phase === "submitting" ? "Memproses pesanan…" : phase === "redirecting" ? "Mengarahkan ke WhatsApp…" : "Lanjut ke WhatsApp"}
              </button>
            )}
            <p className="text-sm text-muted-foreground">Tinjau dan kirim pesan di WhatsApp.</p>
            <span className="sr-only" role="status">{phase === "redirecting" ? "Mengarahkan ke WhatsApp…" : ""}</span>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
