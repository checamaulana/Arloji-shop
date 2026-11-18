# Lessons Learned - Sultan Arloji

- Gunakan `rtk` untuk menjalankan perintah terminal (misal: `rtk bun x tsc --noEmit`, `rtk bun run build`, `rtk git status`) untuk meminimalkan token LLM.
- Gunakan Next.js App Router dengan struktur direktori proyek (`app`, `components`, `lib`, `types`).
- Selalu patuhi palet Luxury Theme: Obsidian Black (`#0B0B0B`), Charcoal Card (`#171717`), Subtle Border (`#262626`), Imperial Gold (`#D4AF37`), WhatsApp Green (`#25D366` / `#22C55E`).
- Pertahankan mobile-first / mobile-only shell container (`max-w-md mx-auto`) di desktop.
- Pada `ai` SDK v7+: gunakan `streamText` dengan `result.toTextStreamResponse()` dan pembacaan stream teks murni pada client reader.
- Pada `firebase-admin` modern: gunakan modular imports seperti `import { initializeApp, cert, getApps } from "firebase-admin/app"` dan `import { getFirestore } from "firebase-admin/firestore"`.
- Sediakan fallback data awal (`initial-data.ts`) agar katalog dan asisten AI tetap dapat dijalankan secara lancar dan siap didemokan meskipun saat awal Firebase Cloud credentials belum diisi secara penuh.
- Pada Next.js 16, penggunaan `usePathname()` di client component perlu dibungkus dengan `Suspense` agar route dapat diprerender.
- Untuk aturan lint React Hooks proyek ini, muat data di dalam effect asinkron dan lakukan perubahan state setelah operasi async selesai, bukan secara sinkron di awal effect.
