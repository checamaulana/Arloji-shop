import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth/verify-admin";
import { adminDb } from "@/lib/firebase/admin";

export async function PATCH(request: Request, context: RouteContext<"/api/orders/[id]">) {
  if (!(await verifyAdminRequest())) {
    return NextResponse.json({ error: "Sesi admin tidak valid." }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    const body: unknown = await request.json();
    if (
      typeof body !== "object" ||
      body === null ||
      !("status" in body) ||
      body.status !== "completed"
    ) {
      return NextResponse.json(
        { error: "Status pesanan yang diminta tidak valid." },
        { status: 400 }
      );
    }

    const orderRef = adminDb.collection("orders").doc(id);
    const order = await orderRef.get();
    if (!order.exists) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
    }
    if (order.data()?.status !== "active") {
      return NextResponse.json(
        { error: "Hanya pesanan aktif yang dapat diselesaikan." },
        { status: 409 }
      );
    }

    await orderRef.update({
      status: "completed",
      completed_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error completing order:", error);
    return NextResponse.json({ error: "Gagal memperbarui status pesanan." }, { status: 500 });
  }
}
