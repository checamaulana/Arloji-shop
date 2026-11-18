import { AdminProductForm } from "@/components/admin/admin-product-form";

export default async function EditProductPage({
  params,
}: PageProps<"/admin/barang/[id]">) {
  const { id } = await params;
  return <AdminProductForm productId={id} />;
}
