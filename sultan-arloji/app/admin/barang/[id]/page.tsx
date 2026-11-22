import { AdminProductForm } from "@/components/admin/admin-product-form";
import { AdminAuthGuard } from "@/components/admin/admin-auth-guard";

export default async function EditProductPage({
  params,
}: PageProps<"/admin/barang/[id]">) {
  const { id } = await params;
  return <AdminAuthGuard><AdminProductForm productId={id} /></AdminAuthGuard>;
}
