# Tech Stack & Architecture (TECH_STACK.md) — Sultan Arloji

Implementasi aktif memakai Supabase Postgres, Auth, dan Storage. Lihat [README](README.md) dan [migrasi SQL](supabase/migrations/20261122000000_initial_schema.sql) untuk konfigurasi aktif. Rincian Firebase di bawah ini berasal dari rencana awal.

Dokumen ini merangkum seluruh tumpukan teknologi (*technology stack*), pustaka dependensi, arsitektur integrasi AI, serta konfigurasi lingkungan kerja sistem **Sultan Arloji**.

---

## 1. Core Framework & Runtime
- **Runtime & Package Manager:** **Bun** (v1.1+). Cepat untuk instalasi paket, eksekusi skrip, dan pengujian.
- **Framework:** **Next.js (App Router, Next.js 14+)**.
- **Bahasa:** **TypeScript** (Strict mode diaktifkan).
- **Styling:** **Tailwind CSS** + **shadcn/ui** (menggunakan Radix UI primitives untuk Drawer, Dialog, Dropdown, Tabs, Button, Badge, Toast/Sonner).
- **Icons:** **Lucide React**.

---

## 2. Backend & Data Services (Firebase Suite)
- **Client SDK:** `firebase` (v10+) — digunakan untuk login admin dan snapshot listener jika dibutuhkan.
- **Admin SDK:** `firebase-admin` (v12+) — dieksekusi eksklusif di server-side Next.js Route Handlers (`/api/*`) untuk operasi sensitif:
  - Verifikasi token otentikasi admin.
  - Mutasi data katalog produk, data toko, dan status pesanan.
  - Pencatatan transaksi pesanan dan counter klik WhatsApp secara atomik (`FieldValue.increment(1)`).
- **Firebase Firestore:**
  - Database NoSQL real-time berkinerja tinggi untuk koleksi produk, pesanan, profil toko, dan analitik kunjungan.
- **Firebase Storage:**
  - Menyimpan aset gambar produk (hingga 5 foto per item) dan logo toko.
  - Menyimpan foto hasil generate AI secara permanen.
- **Firebase Authentication:**
  - Digunakan khusus untuk otentikasi single-admin (Email & Password).

---

## 3. AI Integrations & SDKs

### 3.1. Vercel AI SDK & OpenRouter (Text AI Chatbot)
- **Library:** `ai` dan `@ai-sdk/openai` (dikonfigurasi dengan base URL OpenRouter).
- **Endpoint:** `https://openrouter.ai/api/v1`
- **Model:** `openrouter/free` (misal model router gratis seperti `meta-llama/llama-3.3-70b-instruct:free` atau model free tier aktif lainnya).
- **Arsitektur:**
  - Route handler `POST /api/chat` menerima history percakapan.
  - Server melakukan query data produk aktif dari Firestore dan menyusun ringkasan katalog teks.
  - Disertakan data metrik `whatsapp_clicks` untuk setiap produk agar AI dapat secara akurat menjawab barang terlaris.
  - Mengembalikan respons streaming (`StreamingTextResponse` / `toDataStreamResponse()`) untuk latensi instan di UI mobile customer.

### 3.2. Cloudflare Workers AI (Image Enhancement)
- **Model:** `@cf/black-forest-labs/flux-2-klein-4b`
- **Akses API:** Cloudflare REST API (`https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/run/@cf/black-forest-labs/flux-2-klein-4b`) menggunakan API Token Cloudflare.
- **Preset Prompt Internal:**
  ```text
  "luxury professional wristwatch product photography, sleek dark studio environment with subtle warm gold accents, dramatic studio rim lighting, extreme sharp macro details on dial and bezel, high-end commercial aesthetic, 8k resolution"
  ```
- **Alur Output:** Mengambil raw image buffer hasil AI, mengunggahnya ke Firebase Storage path `products/ai-generated/{uuid}.jpg`, dan menambahkan URL download-nya ke galeri produk di Firestore.

---

## 4. UI / UX Constraints & Layout System
- **Mobile-Only Framing:**
  - Website diakses via viewport mobile secara optimal.
  - Pada layar tablet / desktop, container utama dibatasi dengan wrapper terpusat:
    ```html
    <div className="min-h-screen bg-neutral-950 flex justify-center">
      <main className="w-full max-w-md min-h-screen bg-neutral-900 border-x border-neutral-800 shadow-2xl relative flex flex-col">
        <!-- Content Page -->
      </main>
    </div>
    ```
- **Luxury Theme Palette:**
  - **Background:** Jet Black (`#0B0B0B`), Charcoal Card (`#171717`), Elevated Border (`#262626`).
  - **Primary Accent (Emas/Gold):** Imperial Gold (`#D4AF37`), Light Gold (`#F3E5AB`), Dark Gold (`#997929`).
  - **Text:** Pure White (`#FFFFFF`) untuk judul/konten, Muted Silver/Gray (`#A1A1AA`) untuk label/subteks.
  - **Success / WhatsApp Accent:** Emerald Green (`#22C55E` / `#16A34A`) untuk tombol aksi WhatsApp.

---

## 5. Environment Variables Checklist (`.env.local`)

```env
# Node / Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=""
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=""
NEXT_PUBLIC_FIREBASE_PROJECT_ID=""
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=""
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=""
NEXT_PUBLIC_FIREBASE_APP_ID=""

# Firebase Admin SDK (Server Only)
FIREBASE_ADMIN_PROJECT_ID=""
FIREBASE_ADMIN_CLIENT_EMAIL=""
FIREBASE_ADMIN_PRIVATE_KEY="" # Format RSA Private Key dengan newline escaped \n

# OpenRouter (Vercel AI SDK)
OPENROUTER_API_KEY=""
OPENROUTER_MODEL="meta-llama/llama-3.3-70b-instruct:free"

# Cloudflare Workers AI
CLOUDFLARE_ACCOUNT_ID=""
CLOUDFLARE_API_TOKEN=""
CLOUDFLARE_MODEL_ID="@cf/black-forest-labs/flux-2-klein-4b"
```
