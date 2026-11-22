import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth/verify-admin";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function PATCH(request: Request, context: RouteContext<"/api/orders/[id]">) {
  if (!(await verifyAdminRequest())) {
    return NextResponse.json({ error: "Sesi admin tidak valid." }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  if (body?.status !== "completed") {
    return NextResponse.json({ error: "Status pesanan yang diminta tidak valid." }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();
    const { data, error } = await supabase.from("orders")
      .update({ status: "completed", completed_at: now, updated_at: now })
      .eq("id", id).eq("status", "active").select("id").maybeSingle();
    if (error) throw error;
    if (data) return NextResponse.json({ success: true });

    const { data: existing, error: lookupError } = await supabase.from("orders").select("id").eq("id", id).maybeSingle();
    if (lookupError) throw lookupError;
    if (!existing) return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
    return NextResponse.json({ error: "Hanya pesanan aktif yang dapat diselesaikan." }, { status: 409 });
  } catch (error) {
    console.error("Error completing order:", error);
    return NextResponse.json({ error: "Gagal memperbarui status pesanan." }, { status: 500 });
  }
}
