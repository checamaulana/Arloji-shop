import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth/verify-admin";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { readAllRows } from "@/lib/supabase/catalog";
import type { OrderItem } from "@/types/order";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const customerName = typeof body?.customer_name === "string" ? body.customer_name.trim() : "";
  const customerPhone = typeof body?.customer_phone === "string" ? body.customer_phone.trim() : "";
  const deliveryAddress = typeof body?.delivery_address === "string" ? body.delivery_address.trim() : "";
  const item = body?.item;
  const productName = typeof item?.product_name === "string" ? item.product_name.trim() : "";
  const price = Number(item?.price ?? 0);
  const quantity = Number(item?.quantity ?? 1);
  const totalPrice = Number(body?.total_price ?? 0);

  if (!customerName || !customerPhone || !deliveryAddress || !productName ||
      !Number.isFinite(price) || price < 0 || !Number.isSafeInteger(quantity) || quantity < 1 ||
      !Number.isFinite(totalPrice) || totalPrice < 0) {
    return NextResponse.json({ error: "Mohon lengkapi data pemesanan dengan benar." }, { status: 400 });
  }

  const orderItem: OrderItem = {
    product_id: typeof item.product_id === "string" ? item.product_id : "",
    product_name: productName,
    price,
    quantity,
    photo_url: typeof item.photo_url === "string" ? item.photo_url : "",
  };

  try {
    const { data, error } = await getSupabaseAdmin().rpc("place_order", {
      p_customer_name: customerName,
      p_customer_phone: customerPhone,
      p_delivery_address: deliveryAddress,
      p_item: orderItem,
      p_total_price: totalPrice,
    });
    if (error) throw error;
    return NextResponse.json({ success: true, order_id: data, message: "Pesanan berhasil dicatat." }, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: "Terjadi kesalahan pada server saat membuat pesanan." }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  if (!(await verifyAdminRequest())) {
    return NextResponse.json({ error: "Sesi admin tidak valid." }, { status: 401 });
  }

  const status = request.nextUrl.searchParams.get("status");
  if (status && status !== "active" && status !== "completed") {
    return NextResponse.json({ error: "Filter status tidak valid." }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const orders = await readAllRows((from, to) => {
      const query = supabase.from("orders").select(
        "id, customer_name, customer_phone, delivery_address, item, total_price, status, created_at, completed_at",
      );
      if (status === "active" || status === "completed") query.eq("status", status);
      return query.order("created_at", { ascending: false, nullsFirst: false }).order("id").range(from, to);
    });
    return NextResponse.json({ orders }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Gagal memuat pesanan." }, { status: 500 });
  }
}
