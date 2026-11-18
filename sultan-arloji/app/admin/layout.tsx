import { Suspense } from "react";
import { AdminAuthGuard } from "@/components/admin/admin-auth-guard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0B0B0B] text-sm text-neutral-400">
          Memuat panel admin...
        </div>
      }
    >
      <AdminAuthGuard>{children}</AdminAuthGuard>
    </Suspense>
  );
}
