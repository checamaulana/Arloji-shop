import { Suspense } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <main id="konten" tabIndex={-1} role="status" className="flex app-shell items-center justify-center text-sm text-muted-foreground">
          Memuat panel admin…
        </main>
      }
    >
      {children}
    </Suspense>
  );
}
