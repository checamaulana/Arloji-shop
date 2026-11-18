# Implementation Plan (IMPLEMENTATION_PLAN.md) — Sultan Arloji

Rencana eksekusi bertahap (*step-by-step roadmap*) untuk membangun web aplikasi katalog online **Sultan Arloji** secara terstruktur, teruji, dan bebas dari ambiguitas.

---

## Ringkasan Fase Pengerjaan

| Fase | Fokus | Output Utama |
| :--- | :--- | :--- |
| **Fase 1** | Inisialisasi Proyek & Desain Sistem | Next.js App Router (Bun), Tailwind, shadcn/ui, Luxury Theme Shell |
| **Fase 2** | Integrasi Firebase & Seeding Data | Firebase Client & Admin SDK, Firestore collections, seed profil toko |
| **Fase 3** | Tampilan Katalog & Alur Checkout Customer | Header toko, kartu produk multi-foto, Drawer checkout WhatsApp |
| **Fase 4** | Backend Order & Tracking Pengunjung | API pesanan, increment klik WA atomik, pencatatan pageview harian |
| **Fase 5** | AI Shopping Assistant (OpenRouter) | Floating AI chat widget, Vercel AI SDK streaming, injeksi katalog & ranking terlaris |
| **Fase 6** | Panel Admin: Auth, Navigasi & Dashboard | Login admin, layout guard, 4-menu bottom nav, kartu metrik pengunjung |
| **Fase 7** | Manajemen Produk & AI Foto Studio (Cloudflare) | CRUD produk, upload hingga 5 foto, 1-klik AI studio photo generator |
| **Fase 8** | Manajemen Pesanan & Tab Riwayat (History) | Tab pesanan masuk aktif, tombol "Tandai Selesai", arsip pesanan riwayat |
| **Fase 9** | Pengaturan Profil Toko & Nomor WhatsApp | Update profil toko & sinkronisasi dinamis nomor WA tujuan checkout |
| **Fase 10** | Pengujian Akhir & Deployment Readiness | QA alur transaksi WA, verifikasi mobile-only responsiveness, audit performa |

---

## Rincian Tiap Fase

### Fase 1: Inisialisasi Proyek & Desain Sistem (Foundation)
- [ ] Inisialisasi proyek Next.js (App Router, TypeScript, Tailwind CSS) menggunakan Bun: `bun create next-app .`
- [ ] Konfigurasi `tailwind.config.ts` dengan tema Luxury: Obsidian Black (`#0B0B0B`), Charcoal (`#171717`), Imperial Gold (`#D4AF37`), WhatsApp Green (`#25D366`).
- [ ] Setup shadcn/ui primitives: Button, Dialog, Drawer (Vaul), Input, Badge, Tabs, Skeleton, Toast (Sonner).
- [ ] Bangun layout dasar `AppShell` di `src/app/layout.tsx` dengan batas kontainer mobile terpusat (`max-w-md mx-auto`) di desktop.

### Fase 2: Integrasi Firebase & Seeding Data
- [ ] Setup konfigurasi Firebase Client SDK di `src/lib/firebase/client.ts`.
- [ ] Setup Firebase Admin SDK singleton di `src/lib/firebase/admin.ts`.
- [ ] Buat file konfigurasi `.env.local` dan pastikan seluruh credential lengkap.
- [ ] Buat skrip seeder (`scripts/seed.ts` via Bun) untuk menginisialisasi:
  - Dokumen toko `stores/sultan-arloji` (Nama: "Sultan Arloji", nomor WA default, bio).
  - 3-5 item contoh jam tangan mewah (Rolex, Patek Philippe, Hublot) dengan foto dan harga.

### Fase 3: Tampilan Katalog & Alur Checkout Customer
- [ ] Bangun komponen `HeaderStore` dengan logo Sultan Arloji dan status toko.
- [ ] Bangun komponen `ProductCard` dengan:
  - Carousel geser foto (mendukung hingga 5 foto) dan indikator badge jumlah foto.
  - Nama jam tangan, format harga Rupiah (`Rp xxx.xxx`), dan tombol aksi "+ Tambah / Pesan".
- [ ] Bangun komponen `CheckoutDrawer` (Bottom Sheet):
  - Rincian item yang dipilih dan pengatur jumlah (+ / -).
  - Kotak preview teks pesan WhatsApp dinamis.
  - Form input: Nama Customer, Nomor WhatsApp (default `+62`), dan Alamat / Area.
  - Tombol CTA *"Kirim ke WhatsApp"* dengan link langsung `wa.me/<NO_WA_TOKO>?text=...`.

### Fase 4: Backend Order & Tracking Pengunjung
- [ ] Buat endpoint `POST /api/analytics/track-visit`:
  - Increment counter `pageviews` pada dokumen `analytics_visits/{YYYY-MM-DD}` via `FieldValue.increment(1)`.
- [ ] Pasang hook/trigger kunjungan di halaman utama customer (`src/app/page.tsx`).
- [ ] Buat endpoint `POST /api/orders`:
  - Validasi data pesanan.
  - Simpan dokumen ke koleksi `orders` dengan status `active`.
  - Naikkan field `whatsapp_clicks` pada dokumen produk yang dipesan secara atomik.
- [ ] Integrasikan `CheckoutDrawer` agar mengirim data ke `POST /api/orders` sebelum mengalihkan browser ke WhatsApp.

### Fase 5: AI Shopping Assistant (OpenRouter via Vercel AI SDK)
- [ ] Pasang pustaka `ai` dan `@ai-sdk/openai`.
- [ ] Buat endpoint streaming `POST /api/chat`:
  - Query daftar produk aktif dan nilai `whatsapp_clicks` dari Firestore.
  - Susun system prompt dengan persona Asisten Toko Sultan Arloji yang mengetahui urutan produk terlaris.
  - Hubungkan ke model `openrouter/free` melalui OpenRouter API.
- [ ] Bangun komponen `AIChatFloating` (tombol bubble emas di pojok kanan bawah):
  - Expandable chat dialog mobile-friendly.
  - Quick action prompt ("Apa jam terlaris saat ini?", "Rekomendasi jam formal?").
  - Tampilan bubble chat streaming interaktif.

### Fase 6: Panel Admin (Auth, Navigasi & Dashboard Beranda)
- [ ] Buat halaman login admin di `src/app/admin/login/page.tsx` menggunakan Firebase Auth Client.
- [ ] Buat layout pelindung `src/app/admin/layout.tsx` untuk memvalidasi status login admin (redirect jika unauthenticated).
- [ ] Bangun komponen `AdminNav` (Fixed Bottom Navigation Bar dengan 4 menu: Beranda, Pesanan, Barang, Toko).
- [ ] Bangun dashboard beranda `src/app/admin/page.tsx`:
  - Widget Banner Salin Link Toko (dengan fungsi copy clipboard & native share).
  - Kartu Metrik: Total Pesanan Masuk, Total Produk Aktif, dan Total Pengunjung.
  - Filter rentang waktu pengunjung: Hari Ini, 7 Hari Terakhir, 30 Hari Terakhir, dan Semua Waktu via `GET /api/analytics/stats`.

### Fase 7: Manajemen Produk & AI Foto Studio (Cloudflare)
- [ ] Bangun halaman daftar barang `src/app/admin/barang/page.tsx` dengan status stok dan tombol tambah.
- [ ] Bangun form tambah/edit barang `src/app/admin/barang/tambah/page.tsx`:
  - Input: Nama Barang, Harga, Keterangan opsional.
  - Multi-photo uploader ke Firebase Storage (maksimal 5 slot foto).
  - Toggle status stok (Tersedia / Habis).
- [ ] Implementasikan endpoint `POST /api/ai/enhance-image`:
  - Integrasi Cloudflare Workers AI model `@cf/black-forest-labs/flux-2-klein-4b`.
  - Preset prompt otomatis studio jam tangan mewah tanpa perlu admin mengetik prompt.
  - Unggah hasil generate ke Firebase Storage dan kembalikan URL.
- [ ] Tambahkan tombol 1-klik "AI Studio Enhance" pada setiap slot foto yang diunggah, dan simpan hasilnya sebagai foto alternatif.

### Fase 8: Manajemen Pesanan & Tab Riwayat (History)
- [ ] Bangun halaman `src/app/admin/pesanan/page.tsx` dengan dua tab: **Pesanan Masuk (Aktif)** dan **Riwayat (History)**.
- [ ] Tab Pesanan Masuk:
  - Tampilkan rincian pesanan (Nama, No WA customer, Alamat, Item, Total).
  - Tombol aksi **"Tandai Selesai"**.
- [ ] Buat endpoint `PATCH /api/orders/[id]` untuk memperbarui status pesanan menjadi `completed`.
- [ ] Tab Riwayat (History):
  - Menampilkan seluruh pesanan berstatus `completed` sebagai arsip transaksi.

### Fase 9: Pengaturan Profil Toko & Sinkronisasi Nomor WhatsApp
- [ ] Bangun halaman `src/app/admin/toko/page.tsx`:
  - Form ubah Nama Toko dan Bio.
  - Upload Foto Profil / Logo Toko ke Firebase Storage.
  - Input field **Nomor WhatsApp Toko** (nomor admin penerima pesanan).
  - Form ganti Email & Password admin.
- [ ] Buat endpoint `PUT /api/store` untuk memperbarui data toko di Firestore.
- [ ] Pastikan seluruh drawer checkout customer membaca nomor WhatsApp terbaru ini secara dinamis.

### Fase 10: Pengujian Akhir & QA
- [ ] **End-to-End Checkout Test:** Uji pembuatan pesanan dari katalog customer, penyimpanan ke Firestore, counter klik WA, hingga pembukaan aplikasi WhatsApp dengan pesan terformat rapi.
- [ ] **AI Assistant Test:** Uji chatbot untuk memastikan akurasi data katalog dan rekomendasi jam terlaris.
- [ ] **AI Foto Test:** Uji proses 1-klik Cloudflare Workers AI dan pastikan foto alternatif tersimpan aman di Firebase Storage.
- [ ] **Mobile Responsiveness Test:** Verifikasi tampilan pada ukuran viewport mobile sesungguhnya (iPhone, Android) dan frame terpusat di desktop.
