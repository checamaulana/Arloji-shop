import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { StoreDocument } from "@/types/store";
import { initialStoreData } from "@/lib/data/initial-data";
import { FieldValue } from "firebase-admin/firestore";

export async function GET() {
  try {
    const docRef = adminDb.collection("stores").doc("sultan-arloji");
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      const data = docSnap.data() as StoreDocument;
      return NextResponse.json({ store: data });
    }

    return NextResponse.json({ store: initialStoreData });
  } catch (error) {
    console.warn("Using fallback store info:", error);
    return NextResponse.json({ store: initialStoreData });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, whatsapp_number, bio, logo_url } = body;

    const docRef = adminDb.collection("stores").doc("sultan-arloji");
    const updateData: Partial<StoreDocument> = {
      updated_at: FieldValue.serverTimestamp(),
    };

    if (name) updateData.name = name;
    if (whatsapp_number) updateData.whatsapp_number = whatsapp_number;
    if (bio !== undefined) updateData.bio = bio;
    if (logo_url !== undefined) updateData.logo_url = logo_url;

    await docRef.set(updateData, { merge: true });

    return NextResponse.json({ success: true, message: "Profil toko berhasil diperbarui." });
  } catch (error) {
    console.error("Error updating store:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui profil toko." },
      { status: 500 }
    );
  }
}
