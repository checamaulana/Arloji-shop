import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth/verify-admin";
import { adminDb } from "@/lib/firebase/admin";

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
    const todayString = today.toISOString().slice(0, 10);
    const startDate = new Date(today);
    const days = range === "today" ? 1 : range === "7d" ? 7 : 30;
    startDate.setUTCDate(startDate.getUTCDate() - (days - 1));
    const startString = startDate.toISOString().slice(0, 10);

    const snapshot = await adminDb.collection("analytics_visits").get();
    let pageviews = 0;
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const date = typeof data.date === "string" ? data.date : doc.id;
      if (
        range === "all" ||
        (date >= startString && date <= todayString)
      ) {
        pageviews += Number(data.pageviews) || 0;
      }
    }

    return NextResponse.json({ range, pageviews });
  } catch (error) {
    console.error("Error fetching visitor statistics:", error);
    return NextResponse.json(
      { error: "Gagal memuat statistik pengunjung." },
      { status: 500 }
    );
  }
}
