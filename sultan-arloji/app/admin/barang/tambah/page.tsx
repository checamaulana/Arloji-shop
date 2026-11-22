import { AdminProductForm } from "@/components/admin/admin-product-form";
import { AdminAuthGuard } from "@/components/admin/admin-auth-guard";

export default function AddProductPage() {
  return <AdminAuthGuard><AdminProductForm /></AdminAuthGuard>;
}
