# Sultan Arloji

Katalog jam tangan, pemesanan melalui WhatsApp, dan panel admin. Aplikasi menggunakan Next.js, Supabase Postgres, Supabase Auth, dan Supabase Storage.

## Setup Supabase

1. Pilih proyek Supabase untuk aplikasi ini. Buka **SQL Editor** dan jalankan [migrasi awal](supabase/migrations/20261122000000_initial_schema.sql) satu kali. Migrasi membuat tabel, fungsi pesanan dan analitik, serta bucket publik `store-media`. Akses tulis ke bucket melalui server aplikasi dan URL unggah bertanda tangan. Tabel dan fungsi hanya dapat diakses melalui server aplikasi.
2. Salin [`.env.example`](.env.example) ke `.env.local`, lalu isi URL proyek, publishable key, dan secret key dari proyek yang sama. Simpan `SUPABASE_SECRET_KEY` hanya di server. Untuk proyek dengan kunci lama, gunakan `NEXT_PUBLIC_SUPABASE_ANON_KEY` dan `SUPABASE_SERVICE_ROLE_KEY`.
3. Di **Authentication → Users**, buat akun email dan kata sandi untuk admin. Salin UUID akun tersebut dan jalankan di SQL Editor.

   ```sql
   update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
   where id = 'UUID_AKUN_ADMIN';
   ```

   Gunakan UUID akun yang memang ditunjuk sebagai admin. Sesuaikan Site URL di pengaturan Auth dengan URL aplikasi dan siapkan pengiriman email Supabase agar konfirmasi perubahan alamat email terkirim.

4. Instal dependensi dan jalankan aplikasi.

   ```sh
   bun install
   bun dev
   ```

   Buka `http://localhost:3000` untuk katalog atau `http://localhost:3000/admin/login` untuk login admin. Gunakan `bun run seed` jika ingin mengisi proyek dengan data contoh. Menjalankan seed ulang mempertahankan baris yang sudah ada dengan ID yang sama.

## Migrasi dari Firebase

Buat akun admin di Supabase Auth dan masuk kembali dengan sesi baru. Data contoh bersifat opsional.

Jika ada cadangan Firebase, pulihkan data ke tabel `stores`, `products`, `orders`, dan `analytics_visits` sebelum mengalihkan aplikasi. Pertahankan ID dokumen sebagai teks, konversi timestamp ke ISO 8601, dan pertahankan JSON `item` pada pesanan. Salin foto yang dikelola aplikasi ke folder `products/` dan logo ke folder `store/` pada bucket `store-media`. Perbarui URL di produk, pesanan, dan profil toko dengan URL publik baru.

## Integrasi AI

Isi kredensial OpenRouter untuk chat AI dan Cloudflare Workers AI untuk penyempurnaan foto. Katalog dan panel admin dapat dijalankan tanpa kredensial AI.
