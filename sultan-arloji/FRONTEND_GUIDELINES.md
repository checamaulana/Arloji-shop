# Frontend Guidelines & UI Components (FRONTEND_GUIDELINES.md) — Sultan Arloji

Dokumen ini memuat standar desain antarmuka, tata letak mobile-only, struktur komponen visual, dan hierarki styling untuk aplikasi web **Sultan Arloji**.

---

## 1. Tata Letak Dasar (Mobile-Only Container)

Sistem menggunakan arsitektur **Mobile-Only Framing**:
- Pada perangkat smartphone (lebar layar $\le$ 480px), antarmuka memenuhi 100% layar.
- Pada tablet atau desktop, tampilan dibatasi di tengah layar (*centered column*) selebar `max-w-md` (kira-kira 420px - 448px) dengan latar belakang luar netral gelap agar menyerupai tampilan smartphone elegan.

```tsx
// Root Shell Template
export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-950 flex justify-center text-neutral-100 selection:bg-amber-500/30 selection:text-amber-200">
      <div className="w-full max-w-md min-h-screen bg-[#111111] border-x border-neutral-800/80 shadow-2xl relative flex flex-col pb-20">
        {children}
      </div>
    </div>
  );
}
```

---

## 2. Palet Warna & Branding (Luxury Theme)

Kombinasi warna utama: **Hitam, Emas (Gold), dan Putih**, dipadukan dengan aksen hijau WhatsApp untuk konversi pesan.

| Nama Warna | Kode Hex / Tailwind | Penggunaan |
| :--- | :--- | :--- |
| **Obsidian Black** | `#0B0B0B` / `bg-[#0B0B0B]` | Background dasar aplikasi & outer desktop |
| **Card Surface** | `#171717` / `bg-[#171717]` | Background kartu produk & dashboard cards |
| **Subtle Border** | `#262626` / `border-neutral-800` | Garis pemisah, divider, & border input |
| **Imperial Gold** | `#D4AF37` / `text-[#D4AF37]` | Aksen judul utama, icon highlight, badge rating |
| **Gold Button** | `#C5A059` / `bg-[#C5A059]` | Tombol sekunder / aksen mewah di admin |
| **Pure White** | `#FFFFFF` / `text-white` | Teks judul jam, nama toko, label input |
| **Muted Silver** | `#9CA3AF` / `text-neutral-400` | Subteks, keterangan produk, placeholder |
| **WhatsApp Green**| `#25D366` / `bg-[#25D366]` | Tombol aksi final "Kirim ke WhatsApp" & status online |

---

## 3. Komponen Utama & Referensi UI

### 3.1. Halaman Customer (Katalog Toko)

#### 3.1.1. Header Toko
- Bagian atas dengan latar gelap beraksen gradasi tipis emas/hitam.
- Logo toko berbentuk lingkaran (*avatar*) dengan inisial **"S"** berwarna emas atau logo custom toko.
- Nama Toko: **Sultan Arloji**.
- Sub-bar ringkas dengan status operasional ("Online & Siap Melayani").

#### 3.1.2. Kartu Barang (Product Card)
Mengadopsi tata letak referensi *Superstore* dengan sentuhan arloji mewah:
- **Foto Produk:** Thumbnail rasio 1:1 (*aspect-square*), sudut melengkung halus (`rounded-2xl`).
  - Badge jumlah foto di pojok bawah foto (contoh: `📸 4 foto`).
  - Dapat di-swipe / tap untuk melihat hingga 5 foto produk.
- **Informasi:**
  - Judul Barang: Teks tebal, 2-3 baris (contoh: *"Rolex Batgirl GMT Master II Bezel Hitam Biru Dial Hitam"*).
  - Harga: Format Rupiah tebal (contoh: `Rp 420.000` atau `Rp 0` jika hubungi admin).
  - Keterangan ringkas (opsional).
- **Tombol Aksi:** Tombol rounded penuh bertuliskan **"Tambah"** atau **"Pesan"** (`bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-5 py-2 rounded-full`).

#### 3.1.3. Drawer Checkout WhatsApp (Bottom Sheet)
Muncul dari bawah ketika customer menekan tombol order:
1. **Header Drawer:** Judul *"PESANANMU"*, nama jam tangan terpilih, dan harga.
2. **Kuantitas Selector:** Tombol minus (`-`), angka kuantitas (`1`), dan plus (`+`) dalam kapsul rounded.
3. **Pesan WhatsApp Preview Box:**
   - Kotak berwarna abu-abu/krem lembut (`bg-neutral-800/60 p-4 rounded-2xl border border-neutral-700/50`).
   - Ikon WhatsApp + label: *"Pesan dari WhatsApp kamu"*.
   - Preview teks pesan otomatis:
     ```text
     Halo kak, mau pesan:

     1x [Nama Jam Tangan] — Rp 420.000

     Total: Rp 420.000

     Nama: [Nama Input]
     Alamat: [Alamat Input]
     ```
4. **Form Input Customer:**
   - Field **Nama kamu** (placeholder: *"Wati Lestari"*).
   - Field **Nomor WhatsApp** (dengan prefix `ID +62` dan placeholder: *"812 3456 7890"*).
   - Field **Alamat / area** (placeholder: *"Kemang, Jakarta Selatan"*).
5. **Tombol CTA Checkout:**
   - Tombol lebar penuh berwarna hijau WhatsApp (`bg-[#25D366] hover:bg-[#1EBE5D] text-white font-semibold py-4 rounded-full flex items-center justify-center gap-2`).
   - Ikon logo WhatsApp + teks *"Kirim ke WhatsApp"*.

#### 3.1.4. Floating AI Chat Assistant
- Floating round button di pojok kanan bawah (`bottom-6 right-4 z-40`).
- Ikon bot dengan aksen lingkaran emas berpendar.
- Saat di-tap, membuka expandable modal obrolan berlatar dark glassmorphism.
- Menampilkan pesan selamat datang: *"Halo! Saya Asisten AI Sultan Arloji. Ada yang bisa saya bantu terkait koleksi jam tangan kami?"*.
- Bubble chat responsif dengan streaming respons teks via Vercel AI SDK.

---

### 3.2. Panel Admin (Admin Dashboard & Navigation)

#### 3.2.1. Bottom Navigation Bar (Admin Menu)
Terletak fixed di bagian bawah layar admin:
1. **Beranda:** Dashboard ringkasan trafik dan metrik toko.
2. **Pesanan:** Tab pesanan aktif dan toggle ke tab riwayat/history.
3. **Barang:** Pengelolaan katalog produk, tambah item, dan enhancer AI.
4. **Toko:** Pengaturan nama toko, nomor WhatsApp, foto profil, dan kredensial admin.

#### 3.2.2. Metric Cards (Dashboard Beranda)
Grid 2x2 kartu metrik elegan (seperti pada referensi gambar):
- **Kartu Pesanan:** Ikon belanja, total pesanan masuk, indikator perbandingan ("+0 · 7 hari").
- **Kartu Pengunjung:** Ikon mata, total pembeli / pengunjung unik, badge rentang waktu.
- **Kartu Barang:** Ikon kotak paket, total jumlah barang aktif di katalog.
- **Kartu Toko Dibuka:** Total pageviews akumulasi atau durasi toko aktif.

#### 3.2.3. Banner Salin Link Toko
- Banner kartu gelap beraksen emas di dashboard admin:
  - Teks: *"Link Toko Online Sultan Arloji"*.
  - Field URL toko: `sultan-arloji.com` (atau URL domain aktif).
  - Tombol **"Salin Link"** dan **"Kirim ke WhatsApp / Share"**.

#### 3.2.4. Form Tambah Barang & AI Enhance
- Upload multi-gambar (drag-and-drop / file picker mobile) dengan preview 5 kotak slot foto.
- Tiap foto memiliki tombol kecil: **"AI Studio Enhance"**.
- Saat ditekan, muncul indikator loading spinner animasi emas: *"AI sedang menyempurnakan foto ke studio luxury..."*.
- Setelah selesai, foto baru langsung dimasukkan sebagai slot foto berikutnya.

---

## 4. Tipografi & Font
- **Primary Font:** `Plus Jakarta Sans` atau `Inter` (dimuat via `next/font/google`).
- **Heading Styles:** `font-semibold tracking-tight text-white`.
- **Price Styles:** `font-bold text-amber-400 tracking-wide`.
- **Micro-copy & Captions:** `text-xs text-neutral-400 font-medium`.

---

## 5. Feedback & Notifikasi UI
- Seluruh konfirmasi aksi (contoh: link berhasil disalin, pesanan ditandai selesai, foto berhasil di-enhance) menggunakan komponen **Sonner Toast** dengan tema dark/gold yang senada.
- Loading states menggunakan skeleton shimmer (`animate-pulse bg-neutral-800 rounded-xl`).
