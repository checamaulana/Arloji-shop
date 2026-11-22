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
    }

    if (catalogList.length === 0) {
      catalogList = initialProducts.map((p) => ({
        name: p.name,
        price: p.price,
        description: p.description,
        stock_status: p.stock_status,
        whatsapp_clicks: p.whatsapp_clicks,
      }));
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

    const systemPrompt = `Kamu adalah Asisten AI Resmi dari butik jam tangan mewah "Sultan Arloji".
Peranmu adalah memberikan pelayanan concierge kelas dunia kepada calon kolektor dan pembeli jam tangan mewah.

Karakteristik & Gaya Komunikasi:
- Selalu bertutur kata ramah, santun, elegan, berwawasan horologi mendalam, dan menggunakan Bahasa Indonesia yang baik.
- Tahu persis daftar katalog jam tangan yang tersedia beserta tingkat popularitasnya (berdasarkan klik pesanan WhatsApp).
- Rekomendasikan produk terlaris jika ditanya jam tangan paling populer atau terfavorit.
- Rekomendasikan jam formal (Dress Watch seperti Patek Philippe / Audemars Piguet), jam diving/sport (seperti Rolex Submariner), atau jam dual time traveler (seperti Rolex GMT-Master II) sesuai preferensi penanya.
- Berikan saran yang objektif dan ingatkan customer bahwa seluruh unit kami 100% Original & bergaransi.
- Selalu sarankan customer untuk menekan tombol "Pesan" pada kartu jam di halaman katalog untuk melanjutkan transaksi via WhatsApp resmi Sultan Arloji.

Katalog Jam Tangan Sultan Arloji Saat Ini (Diurutkan dari yang paling diminati):
${formattedCatalog}

Catatan Toko:
Nomor WhatsApp Admin: ${initialStoreData.whatsapp_number}
Lokasi & Jangkauan: Pengiriman berasuransi ke seluruh Indonesia.`;

    // 3. Check if OPENROUTER_API_KEY is available
    const apiKey = process.env.OPENROUTER_API_KEY;
    const modelName = process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free";

    if (!apiKey || apiKey.trim() === "" || apiKey === "mock-openrouter-key") {
      // Mock streaming fallback for development/demo
      const userMessage = messages[messages.length - 1]?.content || "";
      let mockReply = `Halo! Selamat datang di Sultan Arloji. `;

      const lower = userMessage.toLowerCase();
      if (lower.includes("terlaris") || lower.includes("populer") || lower.includes("rekomendasi")) {
        const topItem = catalogList[0];
        mockReply += `Saat ini produk terlaris dan paling diminati di butik kami adalah **${topItem?.name}** (${formatRupiah(topItem?.price || 0)}), yang telah dipilih lebih dari ${topItem?.whatsapp_clicks} kali oleh para kolektor.\n\nApakah Anda mencari jam untuk acara formal, koleksi investasi, atau penggunaan harian?`;
      } else if (lower.includes("formal") || lower.includes("pesta")) {
        mockReply += `Untuk acara formal dan eksekutif, kami sangat merekomendasikan **Patek Philippe Nautilus 5711** atau **Audemars Piguet Royal Oak**. Keduanya memiliki profil ramping nan ikonik yang memancarkan aura kemewahan tak terbantahkan.\n\nSilakan tekan tombol **Pesan** pada katalog untuk terhubung langsung ke WhatsApp admin kami.`;
      } else {
        mockReply += `Saya siap membantu Anda memilih jam tangan impian dari koleksi terbaik kami (Rolex, Patek Philippe, Audemars Piguet, Hublot). Seluruh unit terjamin 100% Original.\n\nAda model atau kriteria khusus yang sedang Anda cari?`;
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
      { error: "Mohon maaf, asisten AI sedang sibuk. Silakan hubungi kami via WhatsApp." },
      { status: 500 }
    );
  }
}
