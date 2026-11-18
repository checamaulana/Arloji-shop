import { adminDb } from "../lib/firebase/admin";
import { initialStoreData, initialProducts } from "../lib/data/initial-data";

async function seed() {
  console.log("🚀 Memulai seeding data Sultan Arloji ke Firestore...");

  try {
    // 1. Seed Profil Toko
    console.log("📦 Menyimpan profil toko ke koleksi 'stores/sultan-arloji'...");
    await adminDb.collection("stores").doc("sultan-arloji").set(
      {
        ...initialStoreData,
        updated_at: new Date(),
      },
      { merge: true }
    );
    console.log("✅ Profil toko berhasil disimpan!");

    // 2. Seed Produk Jam Tangan
    console.log("📦 Menyimpan produk contoh ke koleksi 'products'...");
    const productsCollection = adminDb.collection("products");

    for (const product of initialProducts) {
      const docRef = await productsCollection.add({
        ...product,
        created_at: new Date(),
        updated_at: new Date(),
      });
      console.log(`✅ Produk ditambahkan: "${product.name}" (ID: ${docRef.id})`);
    }

    console.log("\n🎉 Seeding selesai dengan sukses!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Gagal melakukan seeding:", error);
    console.log("💡 Pastikan credential Firebase Admin SDK (.env.local) telah dikonfigurasi dengan benar.");
    process.exit(1);
  }
}

seed();
