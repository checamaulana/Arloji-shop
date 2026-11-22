import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth/verify-admin";
import { initialProducts } from "@/lib/data/initial-data";
import { isProductInput } from "@/lib/products/validation";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { readProducts } from "@/lib/supabase/catalog";

export async function GET(request: NextRequest) {
  const adminRequest = request.nextUrl.searchParams.get("admin") === "1";
  if (adminRequest && !(await verifyAdminRequest())) {
    return NextResponse.json({ error: "Sesi admin tidak valid." }, { status: 401 });
  }

  try {
    const products = await readProducts();
    if (adminRequest) return NextResponse.json({ products }, { headers: { "Cache-Control": "private, no-store" } });
    if (products.length) return NextResponse.json({ products });
  } catch (error) {
    if (adminRequest) {
      console.error("Could not load products for admin:", error);
      return NextResponse.json({ error: "Gagal memuat produk." }, { status: 500 });
    }
    console.warn("Using fallback products:", error);
  }

  return NextResponse.json({ products: initialProducts.map((product, index) => ({
    ...product,
    id: `local-demo-${index + 1}`,
  })) });
}

export async function POST(request: Request) {
  if (!(await verifyAdminRequest())) {
    return NextResponse.json({ error: "Sesi admin tidak valid." }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  if (!isProductInput(body)) {
    return NextResponse.json({ error: "Nama, harga, status stok, atau foto produk tidak valid." }, { status: 400 });
  }

  try {
    const { data, error } = await getSupabaseAdmin().from("products").insert({
      name: body.name.trim(),
      price: body.price,
      description: body.description.trim(),
      photos: body.photos,
      stock_status: body.stock_status,
    }).select("id").single();
    if (error) throw error;
    return NextResponse.json({ success: true, product_id: data.id }, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Gagal menyimpan produk." }, { status: 500 });
  }
}
