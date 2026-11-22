import { AdminProductList } from "@/components/admin/admin-product-list";
import { AdminAuthGuard } from "@/components/admin/admin-auth-guard";

export default function AdminProductsPage() {
  return <AdminAuthGuard><AdminProductList /></AdminAuthGuard>;
}
