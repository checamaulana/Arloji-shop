import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST() {
  const date = new Date().toISOString().slice(0, 10);
  try {
    const { error } = await getSupabaseAdmin().rpc("record_visit", { p_date: date });
    if (error) throw error;
    return NextResponse.json({ success: true, date });
  } catch (error) {
    console.error("Error tracking visit:", error);
    return NextResponse.json({ success: false, error: "Failed to record visit" });
  }
}
