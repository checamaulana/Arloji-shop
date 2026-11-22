import { getSupabaseAdmin } from "../lib/supabase/admin";
import { initialProducts, initialStoreData } from "../lib/data/initial-data";

async function seed() {
  const supabase = getSupabaseAdmin();
  const { error: storeError } = await supabase.from("stores").upsert({
    id: "sultan-arloji",
    name: initialStoreData.name,
    logo_url: initialStoreData.logo_url,
    whatsapp_number: initialStoreData.whatsapp_number,
    bio: initialStoreData.bio ?? "",
  }, { onConflict: "id", ignoreDuplicates: true });
  if (storeError) throw storeError;

  const { error } = await supabase.from("products").upsert(
    initialProducts.map((product, index) => ({
      ...product,
      id: `seed-${index + 1}`,
      description: product.description ?? "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })),
    { onConflict: "id", ignoreDuplicates: true },
  );
  if (error) throw error;
  console.log("Data contoh Sultan Arloji tersedia di Supabase.");
}

seed().catch((error) => {
  console.error("Gagal mengisi data contoh:", error);
  process.exitCode = 1;
});
