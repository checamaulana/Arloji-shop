import { Suspense } from "react";
import { AdminAuthGuard } from "@/components/admin/admin-auth-guard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <main id="konten" tabIndex={-1} role="status" className="flex app-shell items-center justify-center text-sm text-muted-foreground">
          Memuat panel admin…
        </main>
      }
    >
      <AdminAuthGuard>{children}</AdminAuthGuard>
    </Suspense>
  );
}
