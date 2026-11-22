# Lessons Learned - Sultan Arloji

- Gunakan `rtk` untuk menjalankan perintah terminal (misal: `rtk bun x tsc --noEmit`, `rtk bun run build`, `rtk git status`) untuk meminimalkan token LLM.
- Gunakan Next.js App Router dengan struktur direktori proyek (`app`, `components`, `lib`, `types`).
- Selalu patuhi palet Luxury Theme: Obsidian Black (`#0B0B0B`), Charcoal Card (`#171717`), Subtle Border (`#262626`), Imperial Gold (`#D4AF37`), WhatsApp Green (`#25D366` / `#22C55E`).
- Pertahankan mobile-first / mobile-only shell container (`max-w-md mx-auto`) di desktop.
- Pada `ai` SDK v7+: gunakan `streamText` dengan `result.toTextStreamResponse()` dan pembacaan stream teks murni pada client reader.
- Verifikasi sesi admin Supabase di server dan ambil peran dari `app_metadata`. Berikan URL unggah bertanda tangan setelah autentikasi admin.
- Pertahankan `initial-data.ts` sebagai data contoh untuk katalog publik dan asisten AI ketika database belum siap.
- Pada Next.js 16, penggunaan `usePathname()` di client component perlu dibungkus dengan `Suspense` agar route dapat diprerender.
- Untuk aturan lint React Hooks proyek ini, muat data di dalam effect asinkron dan lakukan perubahan state setelah operasi async selesai, bukan secara sinkron di awal effect.
- Pada REST API Cloudflare Workers AI, pertahankan garis miring ID model di URL. Untuk FLUX.2 klein 4B, kirim foto referensi melalui `input_image_0` dengan kedua sisi di bawah 512 piksel.
- Saat Cloudflare menolak hasil penyempurnaan foto dengan kode 3030, sesuaikan kontras dan ketajaman foto sumber dengan Sharp dan beri label yang sesuai pada hasilnya.
- Batas penggunaan Cloudflare Workers AI dapat muncul sebagai HTTP 429 dengan kode 4006. Gunakan jalur penyempurnaan lokal dan tampilkan alasannya di panel admin.
