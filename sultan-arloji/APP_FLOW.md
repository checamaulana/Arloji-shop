# Application Flow (APP_FLOW.md) — Sultan Arloji

Dokumen ini mendefinisikan seluruh alur pengguna (*user flow*), logika transisi halaman, dan interaksi sistem secara terperinci untuk **Sultan Arloji**.

---

## 1. Customer User Flows

### 1.1. Alur Eksplorasi Katalog & Kunjungan Toko
```mermaid
flowchart TD
    Start([Customer membuka URL /]) --> LogVisit[Sistem trigger POST /api/analytics/track-visit]
    LogVisit --> FetchStore[Fetch Profil Toko & Katalog Produk Aktif]
    FetchStore --> RenderCatalog[Tampilkan Header Toko & Kartu Produk Mobile]
    RenderCatalog --> ActionChoice{Pilihan Tindakan Customer}
    ActionChoice -->|Lihat Foto Lain| SlidePhoto[Geser Carousel Foto - maks 5 foto]
    ActionChoice -->|Tanya AI| OpenAIChat[Klik Floating Chatbot Icon]
    ActionChoice -->|Beli Produk| ClickCheckout[Klik Tombol Tambah / Pesan]
```

### 1.2. Alur Checkout WhatsApp & Pencatatan Pesanan
```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant UI as Mobile UI (Drawer)
    participant API as /api/orders
    participant DB as Firestore Database
    participant WA as WhatsApp App / Web

    Customer->>UI: Klik tombol "Tambah / Pesan" pada item jam
    UI->>UI: Buka Bottom Drawer dengan ringkasan pesanan & form
    Customer->>UI: Isi form (Nama, Nomor WA, Alamat Pengiriman)
    Customer->>UI: Klik tombol "Kirim ke WhatsApp"
    UI->>UI: Validasi form (Pastikan field tidak kosong)
    UI->>API: POST /api/orders (Data pesanan, items, total, customer info)
    API->>DB: 1. Simpan dokumen pesanan (status: "active")
    API->>DB: 2. Increment field whatsapp_clicks pada dokumen produk
    API-->>UI: Response HTTP 200 OK (orderId)
    UI->>UI: Format teks WA (Nama, Alamat, Rincian Jam, Total Harga)
    UI->>WA: Buka URL wa.me/<NO_WA_TOKO>?text=<ENCODED_MESSAGE>
```

### 1.3. Alur Chatbot AI Customer (Konsultasi & Rekomendasi)
```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant ChatWidget as Floating Chat Window
    participant ChatAPI as /api/chat (Vercel AI SDK)
    participant DB as Firestore
    participant OpenRouter as OpenRouter AI (openrouter/free)

    Customer->>ChatWidget: Ketik pertanyaan (e.g. "Jam terlaris apa?")
    ChatWidget->>ChatAPI: POST /api/chat (Messages)
    ChatAPI->>DB: Query seluruh produk aktif (nama, harga, whatsapp_clicks)
    DB-->>ChatAPI: Return ringkasan data produk
    ChatAPI->>ChatAPI: Inject system prompt (Instruksi persona + data katalog + ranking terlaris)
    ChatAPI->>OpenRouter: Kirim request streaming LLM
    OpenRouter-->>ChatAPI: Streaming respon teks
    ChatAPI-->>ChatWidget: Streaming teks ke layar customer
    ChatWidget-->>Customer: Jawaban ramah seputar jam tangan & saran pemesanan
```

---

## 2. Admin User Flows

### 2.1. Alur Autentikasi Admin
```mermaid
flowchart TD
    AdminStart([Akses /admin]) --> CheckAuth{Sudah login?}
    CheckAuth -->|Belum| RedirectLogin[Redirect ke /admin/login]
    CheckAuth -->|Sudah| ShowDashboard[Tampilkan /admin Dashboard]
    RedirectLogin --> SubmitLogin[Input Email & Password]
    SubmitLogin --> FirebaseVerify[Verifikasi via Firebase Auth Client]
    FirebaseVerify -->|Sukses| SetSession[Set Session Cookie / Token]
    SetSession --> ShowDashboard
    FirebaseVerify -->|Gagal| ShowError[Tampilkan Pesan Error]
```

### 2.2. Alur Pengaturan Data Toko & Nomor WhatsApp
1. Admin menavigasi ke tab **Toko** (`/admin/toko`).
2. Sistem memuat dokumen data toko dari Firestore (`stores/sultan-arloji`).
3. Admin dapat mengubah:
   - Logo / Foto Profil (upload gambar baru ke Firebase Storage).
   - Nama Toko.
   - Nomor WhatsApp Toko (nomor aktif yang menerima chat order).
   - Email / Password akun admin (memanggil fungsi update kredensial Firebase Auth).
4. Klik tombol **"Simpan Perubahan"**.
5. API Server Route memvalidasi sesi admin dan memperbarui data di Firestore.
6. Halaman customer langsung menggunakan nomor WhatsApp terbaru secara real-time.

### 2.3. Alur Tambah Produk & Peningkatan Foto AI (Cloudflare Workers AI)
```mermaid
flowchart TD
    StartProduct[Buka /admin/barang] --> ClickAdd[Klik Tambah Barang]
    ClickAdd --> InputDetails[Isi Nama, Harga, Keterangan Opsional]
    InputDetails --> UploadPhoto[Upload Foto Asli - Maks 5 foto ke Firebase Storage]
    UploadPhoto --> UserDecideAI{Ingin Enhancer AI?}
    UserDecideAI -->|Ya| ClickAIEnhance[Klik Tombol AI Enhance pada Foto]
    ClickAIEnhance --> CallCFAI[POST /api/ai/enhance-image kirim URL Foto]
    CallCFAI --> CFFlux[Eksekusi Cloudflare Workers AI model Flux-2 Klein]
    CFFlux --> ReturnGenImg[Generate Foto Studio Jam Mewah Baru]
    ReturnGenImg --> SaveNewToStorage[Simpan foto hasil AI ke Firebase Storage]
    SaveNewToStorage --> AppendToList[Tambahkan sebagai Foto Alternatif di Galeri Produk]
    UserDecideAI -->|Tidak / Selesai| SaveProduct[Klik Simpan Barang]
    AppendToList --> SaveProduct
    SaveProduct --> CommitDB[Simpan Dokumen Produk ke Firestore]
```

### 2.4. Alur Manajemen Pesanan & History
1. Admin membuka tab **Pesanan** (`/admin/pesanan`).
2. Terlihat dua sub-tab: **Pesanan Masuk (Aktif)** dan **Riwayat (History)**.
3. Sub-tab **Pesanan Masuk (Aktif)**:
   - Menampilkan card pesanan dengan rincian: Tanggal/Jam, Nama Pemesan, Nomor WA, Alamat, Item Jam yang dipesan, dan Subtotal.
   - Admin memiliki tombol **"Tandai Selesai"**.
4. Saat tombol **"Tandai Selesai"** ditekan:
   - Frontend memanggil `PATCH /api/orders/[id]` dengan status `completed`.
   - Pesanan langsung berpindah dari daftar aktif ke sub-tab **Riwayat (History)**.
5. Sub-tab **Riwayat (History)**:
   - Menampilkan seluruh pesanan yang telah selesai dikerjakan untuk arsip pencatatan.

### 2.5. Alur Salin Link Toko
1. Pada header dashboard admin (`/admin`), terdapat widget tautan toko publik dan tombol **"Salin"**.
2. Saat diklik:
   - Mengambil URL origin (misal: `https://sultan-arloji.com/`).
   - Menyalin teks URL ke Clipboard menggunakan `navigator.clipboard.writeText()`.
   - Menampilkan toast notifikasi: *"Link toko berhasil disalin!"*.
   - Jika tombol share native ditekan, memicu `navigator.share()` bawaan smartphone.
