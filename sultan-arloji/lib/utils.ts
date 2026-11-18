export { cn } from "cn"

export function formatRupiah(amount: number): string {
  if (isNaN(amount) || amount === 0) return "Rp 0"
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace("Rp", "Rp ")
}

export function formatWhatsAppNumber(phone: string): string {
  // Cleans up phone number and ensures 62 format
  let cleaned = phone.replace(/[^0-9]/g, "")
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.slice(1)
  } else if (!cleaned.startsWith("62")) {
    cleaned = "62" + cleaned
  }
  return cleaned
}
