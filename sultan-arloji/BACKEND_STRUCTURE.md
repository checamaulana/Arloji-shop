# Backend Structure & API Specification (BACKEND_STRUCTURE.md) — Sultan Arloji

Skema Supabase dan kebijakan akses terdapat di [migrasi SQL](supabase/migrations/20261122000000_initial_schema.sql). Endpoint aplikasi tetap berada di `app/api`. Rincian Firestore, Firebase Auth, dan Firebase Storage di bawah ini mendokumentasikan arsitektur sebelum migrasi.

Dokumen ini menjelaskan struktur direktori backend Next.js App Router, skema database Firestore, spesifikasi API Route Handlers, integrasi SDK, dan aturan keamanan data.

---

## 1. Struktur Direktori Proyek

```text
sistem/
├── .env.local
├── .gitignore
├── bun.lockb
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.mjs
├── public/
│   ├── favicon.ico
│   └── placeholders/
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # Root layout (AppShell mobile container)
│   │   ├── page.tsx                    # Customer Home: Katalog Toko Sultan Arloji
│   │   ├── admin/
│   │   │   ├── layout.tsx              # Admin layout & Protected Route guard
│   │   │   ├── page.tsx                # Admin Beranda (Dashboard & Analytics)
│   │   │   ├── login/
│   │   │   │   └── page.tsx            # Form Login Admin
│   │   │   ├── pesanan/
│   │   │   │   └── page.tsx            # Daftar Pesanan Masuk & Tab History
│   │   │   ├── barang/
│   │   │   │   ├── page.tsx            # Katalog Barang Admin
│   │   │   │   └── tambah/
│   │   │   │       └── page.tsx        # Form Tambah/Edit Produk & AI Enhance
│   │   │   └── toko/
│   │   │       └── page.tsx            # Form Data Toko & Nomor WhatsApp
│   │   └── api/
│   │       ├── auth/
│   │       │   └── session/route.ts    # Verify & set session cookie
│   │       ├── store/
│   │       │   └── route.ts            # GET public store info, PUT admin update
│   │       ├── products/
│   │       │   ├── route.ts            # GET all products, POST create product
│   │       │   └── [id]/route.ts       # PUT update product, DELETE product
│   │       ├── orders/
│   │       │   ├── route.ts            # POST create order (public), GET orders (admin)
│   │       │   └── [id]/route.ts       # PATCH toggle order status active/completed
│   │       ├── chat/
│   │       │   └── route.ts            # POST Vercel AI SDK + OpenRouter endpoint
│   │       ├── ai/
│   │       │   └── enhance-image/route.ts # POST Cloudflare Workers AI Image Enhancer
│   │       └── analytics/
│   │           ├── track-visit/route.ts   # POST increment pageview
│   │           └── stats/route.ts         # GET visitor stats (today, 7d, 30d, all)
│   ├── components/
│   │   ├── ui/                         # shadcn/ui primitives (dialog, drawer, button, dll)
│   │   ├── customer/
│   │   │   ├── header-store.tsx        # Header profil Sultan Arloji
│   │   │   ├── product-card.tsx        # Kartu produk dengan photo slider & badge
│   │   │   ├── checkout-drawer.tsx     # Bottom sheet order & WhatsApp redirect
│   │   │   └── ai-chat-floating.tsx    # Floating widget chatbot tanya-jawab
│   │   └── admin/
│   │       ├── admin-nav.tsx           # Fixed Bottom Navbar 4 menu
│   │       ├── stats-card.tsx          # Card statistik pesanan & pengunjung
│   │       ├── share-banner.tsx        # Card salin link toko
│   │       └── ai-photo-uploader.tsx   # Multi-photo upload & 1-click AI enhancer
│   ├── lib/
│   │   ├── firebase/
│   │   │   ├── client.ts               # Inisialisasi Firebase Client SDK
│   │   │   └── admin.ts                # Inisialisasi Firebase Admin SDK (Singleton)
│   │   ├── auth/
│   │   │   └── verify-admin.ts         # Middleware helper validasi token Firebase Admin
│   │   ├── ai/
│   │   │   ├── cloudflare.ts           # Client Cloudflare Workers AI REST API
│   │   │   └── openrouter.ts           # OpenAI compatible provider via Vercel AI SDK
│   │   └── utils.ts                    # Formatter rupiah, text encoder, classnames
│   └── types/
│       ├── product.ts
│       ├── order.ts
│       ├── store.ts
│       └── analytics.ts
```

---

## 2. Skema Database Firestore

### 2.1. Koleksi `stores` (Dokumen ID: `sultan-arloji`)
Menyimpan profil tunggal toko Sultan Arloji:
```typescript
interface StoreDocument {
  name: string;             // "Sultan Arloji"
  logo_url: string;         // URL Firebase Storage logo toko
  whatsapp_number: string;  // Nomor WhatsApp admin tujuan order (contoh: "6281234567890")
  bio?: string;             // Deskripsi singkat toko jam tangan
  updated_at: FirebaseFirestore.Timestamp;
}
```

### 2.2. Koleksi `products` (Dokumen ID: Auto-Generated)
Menyimpan inventaris jam tangan:
```typescript
interface ProductDocument {
  id: string;
  name: string;             // Nama jam tangan
  price: number;            // Harga dalam Rupiah (e.g. 420000)
  description?: string;     // Keterangan / spesifikasi opsional
  photos: string[];         // Array URL gambar di Firebase Storage (Maksimal 5)
  stock_status: "in_stock" | "out_of_stock"; // Pengelolaan manual oleh admin
  whatsapp_clicks: number;  // Counter berapa kali jam ini dipilih untuk checkout WA
  created_at: FirebaseFirestore.Timestamp;
  updated_at: FirebaseFirestore.Timestamp;
}
```

### 2.3. Koleksi `orders` (Dokumen ID: Auto-Generated)
Mencatat pesanan yang dibuat oleh customer saat mengklik tombol WhatsApp:
```typescript
interface OrderItem {
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
}

interface OrderDocument {
  id: string;
  customer_name: string;    // Nama customer yang diinput di drawer
  customer_wa: string;      // Nomor WhatsApp customer
  customer_address: string; // Alamat / area pengiriman
  items: OrderItem[];       // Rincian produk yang dipesan
  total_amount: number;     // Total harga
  status: "active" | "completed"; // "active" (Pesanan Masuk) | "completed" (History)
  created_at: FirebaseFirestore.Timestamp;
  updated_at: FirebaseFirestore.Timestamp;
}
```

### 2.4. Koleksi `analytics_visits` (Dokumen ID: Format Tanggal `YYYY-MM-DD`)
Mencatat akumulasi *pageviews* harian secara efisien dan hemat kuota baca/tulis:
```typescript
interface DailyVisitDocument {
  date: string;             // "2026-11-18"
  pageviews: number;        // Jumlah buka halaman pada hari tersebut (di-increment via atomik)
  last_updated: FirebaseFirestore.Timestamp;
}
```

---

## 3. Spesifikasi API Route Handlers

### 3.1. Public Customer Endpoints

#### `GET /api/store`
- Mengambil informasi profil toko Sultan Arloji (nama, logo, nomor WA tujuan).
- Publik, di-*cache* dengan revalidasi berkala.

#### `GET /api/products`
- Mengambil daftar seluruh barang yang aktif untuk katalog customer.
- Mendukung filter pencarian nama produk jika diperlukan.

#### `POST /api/orders`
- **Request Body:**
  ```json
  {
    "customer_name": "Wati Lestari",
    "customer_wa": "+6281234567890",
    "customer_address": "Kemang, Jakarta Selatan",
    "items": [
      {
        "product_id": "prod_123",
        "product_name": "Rolex Batgirl GMT Master II",
        "price": 420000,
        "quantity": 1
      }
    ],
    "total_amount": 420000
  }
  ```
- **Proses Server:**
  1. Validasi input nama, nomor WA, alamat, dan item.
  2. Menggunakan `adminFirestore` untuk menyimpan dokumen pesanan dengan status `active`.
  3. Menjalankan operasi batch / transaction untuk menaikkan counter `whatsapp_clicks` pada setiap produk terkait: `FieldValue.increment(1)`.
- **Response:** `{ "success": true, "order_id": "ord_abc789" }`

#### `POST /api/analytics/track-visit`
- Menghitung kunjungan setiap kali halaman dibuka.
- Menentukan string tanggal lokal `YYYY-MM-DD`.
- Melakukan *upsert* pada koleksi `analytics_visits/{YYYY-MM-DD}` dengan `pageviews: FieldValue.increment(1)`.
- Ringan, tanpa payload besar, respons langsung `204 No Content`.

#### `POST /api/chat` (Vercel AI SDK + OpenRouter)
- **Request:** Streaming format standard Vercel AI SDK (`{ messages: [...] }`).
- **Proses Server:**
  1. Mengambil seluruh produk aktif dari Firestore.
  2. Menyusun string ringkas daftar katalog:
     ```text
     DAFTAR PRODUK SULTAN ARLOJI:
     1. [Nama]: Rolex Batgirl GMT Master II | Harga: Rp 420.000 | Status: in_stock | Total Minat/Klik WA: 154
     2. [Nama]: Patek Philippe Toska Dial Chronograph | Harga: Rp 420.000 | Status: in_stock | Total Minat/Klik WA: 280 (TERLARIS)
     ...
     ```
  3. Mengirimkan prompt instruksi ke OpenRouter menggunakan model gratis (`openrouter/free`):
     - Persona: Asisten penjualan resmi Sultan Arloji yang sopan, ramah, dan profesional.
     - Tugas: Menjawab pertanyaan produk, merekomendasikan jam terlaris berdasarkan indikator klik WA tertinggi, dan membimbing customer untuk checkout via tombol WhatsApp di katalog.
  4. Mengembalikan respons text stream ke frontend.

---

### 3.2. Protected Admin Endpoints (Memerlukan Verifikasi Bearer Token / Session)

Setiap request ke endpoint admin diverifikasi menggunakan fungsi pembantu:
```typescript
import { adminAuth } from "@/lib/firebase/admin";

export async function verifyAdminRequest(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Unauthorized: Missing Bearer Token");
  }
  const token = authHeader.split("Bearer ")[1];
  const decodedToken = await adminAuth.verifyIdToken(token);
  return decodedToken;
}
```

#### `GET /api/orders?status=active|completed`
- Mengambil daftar pesanan terfilter berdasarkan status aktif atau riwayat/history.
- Diurutkan dari yang terbaru (`created_at desc`).

#### `PATCH /api/orders/[id]`
- Mengubah status pesanan dari `active` ke `completed` (atau sebaliknya).
- Update field `status` dan `updated_at`.

#### `POST /api/products`
- Menyimpan produk baru ke Supabase.
- `POST` dan `PUT` menerima maksimal lima foto. Formulir mengirim URL foto yang sudah ada dan file hasil penyempurnaan yang dipilih sebagai `multipart/form-data`. Server mengunggah file tersebut saat menyimpan produk dan mencatat URL-nya di kolom `photos`.

#### `PUT /api/products/[id]` & `DELETE /api/products/[id]`
- `PUT` memperbarui data produk. `DELETE` menghapus baris produk secara permanen dari tabel `products` di Supabase.

#### `PUT /api/store`
- Memperbarui nama toko, logo, dan nomor WhatsApp admin utama.

#### `GET /api/analytics/stats?range=today|7d|30d|all`
- Menghitung agregasi dari dokumen `analytics_visits`.
- Mengembalikan data angka pengunjung sesuai rentang filter yang dipilih admin untuk ditampilkan di kartu metrik dashboard.

#### `POST /api/ai/enhance-image`
- Menerima JSON dengan `image_url` dari Supabase Storage atau file `image` sebagai `multipart/form-data` untuk menyempurnakan ulang pratinjau.
- Server memvalidasi sesi admin dan mengembalikan gambar hasil Cloudflare Workers AI atau penyesuaian lokal langsung sebagai respons gambar. Header `X-Enhancement-Method` menandai metode yang dipakai.
- Pratinjau tersimpan di browser sampai admin menyimpan barang atau meninggalkan formulir.

---

## 4. Keamanan & Firebase Security Rules

### 4.1. Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Profil Toko: Publik hanya bisa baca, hanya admin yang bisa tulis
    match /stores/{storeId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Produk: Publik hanya bisa baca, admin yang bisa tulis
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Pesanan & Analitik: Dikelola via firebase-admin di server Next.js (Rule ditutup dari client direct write)
    match /orders/{orderId} {
      allow read, write: if false;
    }
    match /analytics_visits/{visitId} {
      allow read, write: if false;
    }
  }
}
```
*Catatan: Seluruh pencatatan order dan analitik pengunjung berjalan via Next.js Server Route yang menggunakan `firebase-admin`, sehingga aman dari manipulasi langsung pada client.*
