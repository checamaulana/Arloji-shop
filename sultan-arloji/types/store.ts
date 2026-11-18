export interface StoreDocument {
  name: string;             // "Sultan Arloji"
  logo_url: string;         // URL Firebase Storage logo toko
  whatsapp_number: string;  // Nomor WhatsApp admin tujuan order (contoh: "6281234567890")
  bio?: string;             // Deskripsi singkat toko jam tangan
  updated_at?: any;
}
