import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth/verify-admin";
import { saveWithProductPhotos } from "@/lib/products/save-photos";
import { readProductInput } from "@/lib/products/validation";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getMediaPath, mediaBucket } from "@/lib/supabase/media";

export async function PUT(request: Request, context: RouteContext<"/api/products/[id]">) {
  if (!(await verifyAdminRequest())) {
    return NextResponse.json({ error: "Sesi admin tidak valid." }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await readProductInput(request);
  if (!body) {
    return NextResponse.json({ error: "Nama, harga, status stok, atau foto produk tidak valid." }, { status: 400 });
  }

  try {
    const data = await saveWithProductPhotos(body.photos, (photos) => getSupabaseAdmin().from("products").update({
      name: body.name.trim(),
      price: body.price,
      description: body.description.trim(),
      photos,
      stock_status: body.stock_status,
      updated_at: new Date().toISOString(),
    }).eq("id", id).select("id").maybeSingle());
    if (!data) return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });

    return NextResponse.json({ success: true, product_id: id });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Gagal memperbarui produk." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext<"/api/products/[id]">) {
  if (!(await verifyAdminRequest())) {
    return NextResponse.json({ error: "Sesi admin tidak valid." }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    const { data, error } = await getSupabaseAdmin().from("products").delete().eq("id", id).select("photos").maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });

    const paths = [...new Set(data.photos.map((url) => getMediaPath(url, "products")).filter((path) => path !== null))];
    if (paths.length) {
      try {
        const { error: storageError } = await mediaBucket().remove(paths);
        if (storageError) throw storageError;
      } catch (storageError) {
        console.error("Could not remove media for deleted product:", id, storageError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: "Gagal menghapus produk." }, { status: 500 });
  }
}
