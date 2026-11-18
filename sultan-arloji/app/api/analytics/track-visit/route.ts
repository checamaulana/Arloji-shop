import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST() {
  try {
    // Current date format YYYY-MM-DD
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0]; // e.g. "2026-11-18"

    const visitRef = adminDb.collection("analytics_visits").doc(dateStr);

    await visitRef.set(
      {
        date: dateStr,
        pageviews: FieldValue.increment(1),
        last_updated: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return NextResponse.json({ success: true, date: dateStr });
  } catch (error) {
    console.error("Error tracking visit:", error);
    // Don't fail the client on tracking error
    return NextResponse.json(
      { success: false, error: "Failed to record visit" },
      { status: 200 }
    );
  }
}
