import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { ProductDocument } from "@/types/product";
import { initialProducts } from "@/lib/data/initial-data";

export async function GET() {
  try {
    const snapshot = await adminDb
      .collection("products")
      .orderBy("whatsapp_clicks", "desc")
      .get();

    if (!snapshot.empty) {
      const products: ProductDocument[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          price: data.price,
          description: data.description || "",
          photos: data.photos || [],
          stock_status: data.stock_status || "in_stock",
          whatsapp_clicks: data.whatsapp_clicks || 0,
          created_at: data.created_at?.toDate?.()?.toISOString() || null,
          updated_at: data.updated_at?.toDate?.()?.toISOString() || null,
        };
      });

      return NextResponse.json({ products });
    }

    // Fallback gracefully jika database belum di-seed
    const fallbackProducts: ProductDocument[] = initialProducts.map((p, idx) => ({
      ...p,
      id: `local-demo-${idx + 1}`,
    }));

    return NextResponse.json({ products: fallbackProducts });
  } catch (error) {
    console.warn("Using fallback products due to Firestore connection:", error);
    const fallbackProducts: ProductDocument[] = initialProducts.map((p, idx) => ({
      ...p,
      id: `local-demo-${idx + 1}`,
    }));

    return NextResponse.json({ products: fallbackProducts });
  }
}
