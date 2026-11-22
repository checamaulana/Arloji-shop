import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { AdminAuthGuard } from "@/components/admin/admin-auth-guard";

export default function AdminHomePage() {
  return <AdminAuthGuard><AdminDashboard /></AdminAuthGuard>;
}
