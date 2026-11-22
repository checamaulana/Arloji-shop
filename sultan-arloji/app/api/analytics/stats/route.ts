import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth/verify-admin";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const VALID_RANGES = ["today", "7d", "30d", "all"] as const;
type StatsRange = (typeof VALID_RANGES)[number];

export async function GET(request: NextRequest) {
  if (!(await verifyAdminRequest())) {
    return NextResponse.json({ error: "Sesi admin tidak valid." }, { status: 401 });
  }

  const range = request.nextUrl.searchParams.get("range") ?? "today";
  if (!VALID_RANGES.includes(range as StatsRange)) {
    return NextResponse.json({ error: "Rentang waktu tidak valid." }, { status: 400 });
  }

  try {
    const today = new Date();
    const start = new Date(today);
    const days = range === "today" ? 1 : range === "7d" ? 7 : 30;
    start.setUTCDate(start.getUTCDate() - (days - 1));
    const { data, error } = await getSupabaseAdmin().rpc("count_visits", {
      p_start: range === "all" ? null : start.toISOString().slice(0, 10),
      p_end: range === "all" ? null : today.toISOString().slice(0, 10),
    });
    if (error) throw error;
    return NextResponse.json({ range, pageviews: data }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Error fetching visitor statistics:", error);
    return NextResponse.json({ error: "Gagal memuat statistik pengunjung." }, { status: 500 });
  }
}
