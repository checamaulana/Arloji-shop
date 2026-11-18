import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth/verify-admin";
import { initialProducts } from "@/lib/data/initial-data";
import { adminDb } from "@/lib/firebase/admin";
import { isProductInput } from "@/lib/products/validation";
import type { ProductDocument } from "@/types/product";

export async function GET(request: NextRequest) {
  const adminRequest = request.nextUrl.searchParams.get("admin") === "1";
  if (adminRequest && !(await verifyAdminRequest())) {
    return NextResponse.json({ error: "Sesi admin tidak valid." }, { status: 401 });
  }

  try {
    const snapshot = await adminDb
      .collection("products")
      .orderBy("whatsapp_clicks", "desc")
      .get();

    if (!snapshot.empty || adminRequest) {
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

    return NextResponse.json({ products: getFallbackProducts() });
  } catch (error) {
    if (adminRequest) {
      console.error("Could not load products for admin:", error);
      return NextResponse.json({ error: "Gagal memuat produk." }, { status: 500 });
    }
    console.warn("Using fallback products due to Firestore connection:", error);
    return NextResponse.json({ products: getFallbackProducts() });
  }
}

export async function POST(request: Request) {
  if (!(await verifyAdminRequest())) {
    return NextResponse.json({ error: "Sesi admin tidak valid." }, { status: 401 });
  }

  try {
    const body: unknown = await request.json();
    if (!isProductInput(body)) {
      return NextResponse.json(
        { error: "Nama, harga, status stok, atau foto produk tidak valid." },
        { status: 400 }
      );
    }

    const now = FieldValue.serverTimestamp();
    const productData = {
      name: body.name.trim(),
      price: body.price,
      description: body.description.trim(),
      photos: body.photos,
      stock_status: body.stock_status,
      whatsapp_clicks: 0,
      created_at: now,
      updated_at: now,
    };

    const productRef = await adminDb.collection("products").add(productData);
    return NextResponse.json(
      { success: true, product_id: productRef.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Gagal menyimpan produk." }, { status: 500 });
  }
}

function getFallbackProducts(): ProductDocument[] {
  return initialProducts.map((product, index) => ({
    ...product,
    id: `local-demo-${index + 1}`,
  }));
}
