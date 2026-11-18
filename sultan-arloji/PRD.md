# Product Requirements Document (PRD) — Sultan Arloji

## 1. Executive Summary
**Sultan Arloji** adalah aplikasi web katalog toko online jam tangan mewah (luxury watches) berbasis *mobile-first* dengan checkout yang langsung terintegrasi ke WhatsApp. Sistem ini dirancang untuk toko tunggal (*single-store*) yang dikelola oleh satu admin utama, memberikan pengalaman berbelanja eksklusif bagi pelanggan tanpa perlu proses registrasi/login yang rumit, serta dashboard manajemen terpadu yang efisien dan dilengkapi otomatisasi AI bagi pemilik toko.

---

## 2. Core Value Proposition & Objectives
- **Bagi Customer:** Kemudahan menjelajahi katalog jam tangan eksklusif dengan visual mewah, konsultasi cepat melalui AI Chatbot yang memahami seluruh isi katalog dan produk terlaris, serta alur pemesanan instan ke WhatsApp resmi toko.
- **Bagi Admin:** Pengelolaan katalog produk (maksimal 5 foto per produk), automasi peningkatan kualitas foto produk menggunakan AI (1-click enhancement tanpa perlu mengetik prompt), pemantauan pesanan & riwayat transaksi, pengaturan profil toko & nomor WhatsApp dinamis, serta analisis jumlah pengunjung (*pageviews*) berbasis rentang waktu.

---

## 3. User Personas & Roles

### 3.1. Customer (Pelanggan)
- **Akses:** Bebas tanpa registrasi/login (Guest).
- **Perangkat:** Dominan smartphone (tampilan web mobile-only responsive dengan frame terpusat pada desktop).
- **Kebutuhan:** Melihat katalog jam, filter/eksplorasi produk, tanya jawab ketersediaan/rekomendasi via AI chat, dan memesan jam tangan via WhatsApp dengan rincian yang sudah terisi otomatis.

### 3.2. Admin (Pemilik Toko Sultan Arloji)
- **Akses:** Terautentikasi melalui Firebase Authentication (Email/Password). Kredensial awal diinisialisasi secara aman dan dapat diperbarui dari panel admin.
- **Perangkat:** Mobile browser atau desktop (tampilan tetap konsisten dalam frame mobile-centric).
- **Kebutuhan:** Mengontrol seluruh operasional toko, mengunggah dan mempercantik foto produk dengan AI, mengubah status pesanan ke history, mengatur nomor WA tujuan order, dan memantau trafik pengunjung.

---

## 4. Functional Requirements

### 4.1. Fitur Admin

#### 4.1.1. Autentikasi & Pengaturan Akun
- Login aman menggunakan Email dan Password via Firebase Auth.
- Admin dapat memperbarui Email dan Password langsung dari dalam panel akun toko.
- Route `/admin` dilindungi oleh session/token validation via Next.js Middleware dan `firebase-admin`.

#### 4.1.2. Manajemen Profil & Data Toko (`/admin/toko`)
- Admin dapat memperbarui:
  - **Nama Toko:** Default "Sultan Arloji".
  - **Foto Profil / Logo Toko:** Upload gambar ke Firebase Storage.
  - **Nomor WhatsApp Toko:** Nomor tujuan seluruh pesanan customer (format internasional, e.g. `6281234567890`). Seluruh link checkout akan langsung mengikuti nomor ini secara dinamis tanpa perlu deploy ulang.
  - **Deskripsi / Bio Toko:** Informasi singkat jam tangan dan layanan garansi.

#### 4.1.3. Dashboard & Analisis Pengunjung (`/admin`)
- **Metrik Trafik:** Menampilkan total kunjungan (*pageviews*) yang dicatat setiap kali halaman toko dibuka oleh customer.
- **Filter Rentang Waktu:**
  - Hari Ini (24 jam)
  - 7 Hari Terakhir
  - 30 Hari Terakhir
  - Sepanjang Waktu (Total Keseluruhan)
- **Kartu Statistik:** Ringkasan jumlah Pesanan Aktif, Total Produk Aktif, dan Total Pengunjung.

#### 4.1.4. Manajemen Produk (`/admin/barang`)
- **Lihat Katalog Barang:** List produk dengan foto utama, nama, harga, status stok, dan jumlah klik WA.
- **Tambah / Edit Barang:**
  - Nama Barang (Wajib)
  - Foto Barang (Maksimal 5 foto, format JPG/PNG/WebP, upload ke Firebase Storage)
  - Harga (IDR / Rupiah, format numerik)
  - Keterangan / Deskripsi (Opsional)
  - Status Stok: Tersedia / Habis (Pengelolaan manual oleh admin)
- **Hapus Barang:** Menghapus data produk dan referensi media terkait.

#### 4.1.5. AI Foto Enhancement (Cloudflare Workers AI)
- Tombol 1-klik di form produk / galeri: **"Tingkatkan Foto dengan AI"**.
- Tidak memerlukan admin mengetik prompt manual; sistem menyisipkan prompt preset studio jam tangan mewah secara otomatis:
  - Mengubah background menjadi luxury dark aesthetic studio (aksen hitam/emas).
  - Mengoreksi POV dan pencahayaan studio profesional.
  - Meningkatkan ketajaman dial dan case jam tangan.
- Menggunakan model Cloudflare Workers AI `@cf/black-forest-labs/flux-2-klein-4b`.
- Hasil foto AI **tidak menimpa foto asli**, melainkan otomatis disimpan sebagai foto alternatif tambahan di galeri produk (selama kuota total belum melebihi 5 foto).

#### 4.1.6. Manajemen Pesanan & History (`/admin/pesanan`)
- **Daftar Pesanan Masuk (Aktif):**
  - Menampilkan pesanan baru yang dikirim oleh customer.
  - Data pesanan: Tanggal & Waktu, Nama Customer, Nomor WhatsApp Customer, Alamat Pengiriman, Rincian Barang yang Dipesan, dan Total Harga.
  - Aksi sederhana: Tombol **"Tandai Selesai"**.
- **Tab History (Riwayat):**
  - Berisi daftar seluruh pesanan yang telah diselesaikan.
  - Membantu pembukuan riwayat transaksi tanpa membebani daftar pesanan aktif.

#### 4.1.7. Salin Link Toko
- Tombol sekali klik di header/dashboard admin untuk menyalin URL web customer (domain utama `/`) ke clipboard.
- Terintegrasi dengan Web Share API jika perangkat mendukung, atau fallback copy-to-clipboard standar.

---

### 4.2. Fitur Customer (Publik)

#### 4.2.1. Beranda & Katalog Produk (`/`)
- Desain *mobile-only* berpusat di tengah layar (*max-w-md*).
- Header toko mewah: Logo Sultan Arloji, Nama Toko, dan tombol akses cepat.
- Daftar kartu produk elegan beraksen Hitam, Emas, dan Putih:
  - Carousel / slide foto (hingga 5 foto) dengan indikator badge (misal: "3 foto").
  - Nama jam tangan mewah.
  - Harga terformat rapi (contoh: `Rp 420.000`).
  - Tombol aksi: **"Tambah" / "Pesan Sekarang"**.

#### 4.2.2. Modal / Drawer Checkout WhatsApp
- Saat menekan tombol beli/tambah, muncul bottom sheet / drawer konfirmasi pesanan (sesuai referensi UI):
  - Rincian item yang dipilih dan pengatur kuantitas (+ / -).
  - Preview teks pesan yang akan terkirim ke WhatsApp.
  - Input field wajib:
    1. **Nama Lengkap** (contoh: "Wati Lestari")
    2. **Nomor WhatsApp** (kode negara default `+62` + nomor handphone)
    3. **Alamat / Area Pengiriman** (contoh: "Kemang, Jakarta Selatan")
- Tombol CTA: **"Kirim ke WhatsApp"** (berwarna Emerald Green atau Gold Luxury).
- **Proses Eksekusi Checkout:**
  1. Frontend memanggil API `/api/orders` untuk mencatat data pesanan ke Firestore.
  2. API meng-increment counter `whatsapp_clicks` pada dokumen produk terkait.
  3. Mengarahkan browser customer ke tautan `https://wa.me/<NO_WA_TOKO>?text=<ENCODED_MESSAGE>`.

#### 4.2.3. AI Shopping Assistant (Floating Chatbot)
- Floating widget (bubble icon di pojok kanan bawah layar).
- Didukung oleh Vercel AI SDK dan LLM OpenRouter (`openrouter/free`).
- **Konteks Cerdas (Katalog Realtime):**
  - Daftar ringkas produk aktif, harga, ketersediaan, dan jumlah `whatsapp_clicks` di-inject ke system prompt LLM.
  - AI mampu menjawab pertanyaan seputar spesifikasi jam, rekomendasi pilihan kado/pria/wanita, dan produk **paling terlaris** (berdasarkan metrik `whatsapp_clicks` tertinggi).
  - Jawaban diformat dalam gaya sopan, ringkas, dan mengarahkan customer untuk memesan via tombol checkout yang ada pada katalog.

---

## 5. Non-Functional Requirements
- **Desain & Estetika:** Skema warna Luxury (Hitam pekat `#0B0B0B` / `#121212`, Emas elegan `#D4AF37` / `#C5A059`, Putih bersih `#FFFFFF`).
- **Mobile First Constraint:** Seluruh interface dikunci pada lebar mobile (`max-w-md mx-auto`) dengan wrapper elegan di desktop.
- **Keamanan Data:** Operasi mutasi data sensitif (tambah produk, update profil, status pesanan) dilindungi lewat API Route Next.js dengan verifikasi token `firebase-admin`.
- **Performa:** Waktu muat awal di bawah 2 detik menggunakan optimasi gambar Next.js Image dan Bun runtime.
- **Ketersediaan & Biaya Efisien:** Memanfaatkan tier gratis Firebase, Cloudflare Workers AI, dan OpenRouter free tier.
