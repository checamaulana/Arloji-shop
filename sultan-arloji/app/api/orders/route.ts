import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { OrderDocument } from "@/types/order";
import { verifyAdminRequest } from "@/lib/auth/verify-admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customer_name,
      customer_phone,
      delivery_address,
      item,
      total_price,
    } = body;

    if (!customer_name || !customer_phone || !delivery_address || !item) {
      return NextResponse.json(
        { error: "Mohon lengkapi seluruh data pemesanan." },
        { status: 400 }
      );
    }

    const newOrderData = {
      customer_name,
      customer_phone,
      delivery_address,
      item: {
        product_id: item.product_id || "",
        product_name: item.product_name || "",
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 1,
        photo_url: item.photo_url || "",
      },
      total_price: Number(total_price) || 0,
      status: "active" as const,
      created_at: FieldValue.serverTimestamp(),
    };

    // 1. Simpan dokumen pesanan ke Firestore
    const orderDocRef = await adminDb.collection("orders").add(newOrderData);

    // 2. Increment counter whatsapp_clicks pada produk secara atomik jika product_id valid
    if (item.product_id) {
      try {
        const productRef = adminDb.collection("products").doc(item.product_id);
        await productRef.update({
          whatsapp_clicks: FieldValue.increment(1),
          updated_at: FieldValue.serverTimestamp(),
        });
      } catch (prodErr) {
        // Jika produk tidak ditemukan di Firestore (misal data lokal), jangan gagalkan pesanan
        console.warn("Could not increment whatsapp_clicks for product:", item.product_id, prodErr);
      }
    }

    return NextResponse.json(
      {
        success: true,
        order_id: orderDocRef.id,
        message: "Pesanan berhasil dicatat.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server saat membuat pesanan." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  if (!(await verifyAdminRequest())) {
    return NextResponse.json({ error: "Sesi admin tidak valid." }, { status: 401 });
  }

  try {
    const status = request.nextUrl.searchParams.get("status");
    if (status && status !== "active" && status !== "completed") {
      return NextResponse.json({ error: "Filter status tidak valid." }, { status: 400 });
    }

    const snapshot = await adminDb
      .collection("orders")
      .orderBy("created_at", "desc")
      .get();

    const orders: OrderDocument[] = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          customer_name: data.customer_name,
          customer_phone: data.customer_phone || data.customer_wa || "",
          delivery_address: data.delivery_address || data.customer_address || "",
          item: data.item,
          total_price: data.total_price,
          status: data.status,
          created_at: data.created_at?.toDate?.()?.toISOString() || null,
          completed_at: data.completed_at?.toDate?.()?.toISOString() || null,
        };
      })
      .filter((order) => !status || order.status === status);

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Gagal memuat pesanan." }, { status: 500 });
  }
}
