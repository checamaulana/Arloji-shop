import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { StoreDocument } from "@/types/store";
import { initialStoreData } from "@/lib/data/initial-data";
import { FieldValue } from "firebase-admin/firestore";
import { verifyAdminRequest } from "@/lib/auth/verify-admin";
import { formatWhatsAppNumber } from "@/lib/utils";

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
  if (!(await verifyAdminRequest())) {
    return NextResponse.json({ error: "Sesi admin tidak valid." }, { status: 401 });
  }

  try {
    const body: unknown = await req.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Data toko tidak valid." }, { status: 400 });
    }

    const data = body as Record<string, unknown>;
    const name = typeof data.name === "string" ? data.name.trim() : undefined;
    const bio = typeof data.bio === "string" ? data.bio.trim() : undefined;
    const logoUrl = typeof data.logo_url === "string" ? data.logo_url.trim() : undefined;
    const whatsappNumber =
      typeof data.whatsapp_number === "string"
        ? formatWhatsAppNumber(data.whatsapp_number)
        : undefined;

    if (name !== undefined && (!name || name.length > 160)) {
      return NextResponse.json({ error: "Nama toko wajib diisi dan maksimal 160 karakter." }, { status: 400 });
    }
    if (bio !== undefined && bio.length > 2000) {
      return NextResponse.json({ error: "Bio maksimal 2000 karakter." }, { status: 400 });
    }
    if (whatsappNumber !== undefined && !/^62\d{8,14}$/.test(whatsappNumber)) {
      return NextResponse.json({ error: "Nomor WhatsApp tidak valid." }, { status: 400 });
    }
    if (logoUrl !== undefined && logoUrl.length > 2048) {
      return NextResponse.json({ error: "URL logo tidak valid." }, { status: 400 });
    }

    const docRef = adminDb.collection("stores").doc("sultan-arloji");
    const updateData: Partial<StoreDocument> = {
      updated_at: FieldValue.serverTimestamp(),
    };

    if (name !== undefined) updateData.name = name;
    if (whatsappNumber !== undefined) updateData.whatsapp_number = whatsappNumber;
    if (bio !== undefined) updateData.bio = bio;
    if (logoUrl !== undefined) updateData.logo_url = logoUrl;

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
