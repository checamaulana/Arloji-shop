import { NextRequest, NextResponse } from "next/server";
import { streamText } from "ai";
import { openrouter } from "@/lib/ai/openrouter";
import { readProducts } from "@/lib/supabase/catalog";
import { initialProducts, initialStoreData } from "@/lib/data/initial-data";
import { formatRupiah } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    // 1. Fetch catalog products and ranking data
    let catalogList: Array<{
      name: string;
      price: number;
      description?: string;
      stock_status: string;
      whatsapp_clicks: number;
    }> = [];

    try {
      catalogList = await readProducts();
    } catch (e) {
      console.warn("Could not load products for AI Chat:", e);
      catalogList = [...initialProducts].sort((first, second) => second.whatsapp_clicks - first.whatsapp_clicks);
    }

    // 2. Format products catalog for system prompt
    const formattedCatalog = catalogList
      .map(
        (item, index) =>
          `${index + 1}. ${item.name} | Harga: ${formatRupiah(item.price)} | Status: ${
            item.stock_status === "in_stock" ? "Tersedia" : "Habis"
          } | Minat/Klik WA: ${item.whatsapp_clicks}x | Deskripsi: ${item.description}`
      )
      .join("\n");

    const systemPrompt = `Kamu asisten katalog Sultan Arloji. Jawab dengan bahasa Indonesia ala Gen Z yang santai, singkat, dan sopan. Pakai aku dan kamu. Gunakan kata sehari-hari seperti "cek" atau "spek" kalau cocok, tanpa memaksakan slang.

Tulis jawaban dalam teks biasa. Jangan gunakan Markdown, huruf tebal, heading, atau tanda penekanan seperti tanda bintang.
Jawab berdasarkan data katalog. Jelaskan harga, stok, spesifikasi, atau perbedaan produk secara netral. Jangan merekomendasikan produk, memilihkan model, atau menyarankan pembelian. Kalau pelanggan meminta rekomendasi, tawarkan untuk membandingkan model yang mereka sebutkan secara faktual.
Bahas popularitas hanya kalau ditanya. Jelaskan bahwa jumlah klik WhatsApp mengukur minat dan sebutkan datanya secara apa adanya.
Jika ditanya soal keaslian, koleksi toko dijual sebagai produk original dan bergaransi. Jika ditanya cara pesan, jelaskan tombol Pesan pada kartu produk untuk membuka WhatsApp admin. Kalau informasinya belum ada di katalog, bilang apa adanya.

Katalog Sultan Arloji, diurutkan berdasarkan klik WhatsApp
${formattedCatalog || "Katalog saat ini kosong."}

Catatan Toko:
Nomor WhatsApp Admin: ${initialStoreData.whatsapp_number}
Lokasi & Jangkauan: Pengiriman berasuransi ke seluruh Indonesia.`;

    // 3. Check if OPENROUTER_API_KEY is available
    const apiKey = process.env.OPENROUTER_API_KEY;
    const modelName = process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free";

    if (!apiKey || apiKey.trim() === "" || apiKey === "mock-openrouter-key") {
      // Mock streaming fallback for development/demo
      const userMessage = messages[messages.length - 1]?.content || "";
      const lower = userMessage.toLowerCase();
      const topItem = catalogList[0];
      let mockReply = "Lagi cek jam apa? Sebutin modelnya aja, ya. Aku bisa bantu cek harga, stok, dan speknya.";

      if (!topItem) {
        mockReply = "Katalog Sultan Arloji lagi kosong. Coba cek lagi nanti, ya.";
      } else if (lower.includes("rekomendasi") || lower.includes("saran") || lower.includes("cocok")) {
        mockReply = "Kalau ada model yang lagi kamu lihat, sebutin namanya aja. Aku bisa bantu bandingin harga, stok, dan speknya.";
      } else if (lower.includes("terlaris") || lower.includes("populer") || lower.includes("klik")) {
        mockReply = `Kalau dilihat dari minat di katalog, ${topItem.name} punya ${topItem.whatsapp_clicks} klik WhatsApp, paling banyak saat ini. Harganya ${formatRupiah(topItem.price)}.`;
      } else if (lower.includes("pesan") || lower.includes("order")) {
        mockReply = "Buka katalog, lalu tap tombol Pesan di kartu jam yang kamu pilih. Nanti kamu bisa lanjut chat admin via WhatsApp.";
      } else if (lower.includes("original") || lower.includes("asli") || lower.includes("garansi")) {
        mockReply = "Iya, koleksi Sultan Arloji dijual sebagai produk original dan bergaransi. Kalau mau cek detailnya, sebutin model jamnya, ya.";
      }

      // Return synthetic streaming response
      const encoder = new TextEncoder();
      const customReadable = new ReadableStream({
        async start(controller) {
          const words = mockReply.split(" ");
          for (const word of words) {
            controller.enqueue(encoder.encode(word + " "));
            await new Promise((r) => setTimeout(r, 30));
          }
          controller.close();
        },
      });

      return new Response(customReadable, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    }

    // 4. Live OpenRouter streaming via Vercel AI SDK
    const result = streamText({
      model: openrouter(modelName),
      system: systemPrompt,
      messages,
      temperature: 0.7,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Error handling AI chat:", error);
    return NextResponse.json(
      { error: "Aku lagi belum bisa jawab. Kamu bisa chat admin via WhatsApp, ya." },
      { status: 500 }
    );
  }
}
