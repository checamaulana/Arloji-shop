import { AdminOrders } from "@/components/admin/admin-orders";
import { AdminAuthGuard } from "@/components/admin/admin-auth-guard";

export default function AdminOrdersPage() {
  return <AdminAuthGuard><AdminOrders /></AdminAuthGuard>;
}
