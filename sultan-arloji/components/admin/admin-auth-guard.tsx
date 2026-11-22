"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminNav } from "@/components/admin/admin-nav";

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checkedPathname, setCheckedPathname] = useState<string | null>(null);

  useEffect(() => {
    if (pathname.endsWith("/login")) return;

    let active = true;
    fetch("/api/auth/session", { cache: "no-store" })
      .then((response) => {
        if (!active) return;
        if (response.ok) setCheckedPathname(pathname);
        else router.replace("/admin/login");
      })
      .catch((error) => {
        console.error("Could not check admin session:", error);
        if (active) router.replace("/admin/login");
      });

    return () => {
      active = false;
    };
  }, [pathname, router]);

  if (pathname.endsWith("/login")) return children;
  if (checkedPathname !== pathname) {
    return (
      <main id="konten" tabIndex={-1} className="app-shell flex items-center justify-center text-sm text-muted-foreground">
        <p role="status">Memeriksa sesi admin…</p>
      </main>
    );
  }

  return (
    <div className="app-shell admin-shell">
      <AdminNav>
        <main id="konten" tabIndex={-1}>{children}</main>
      </AdminNav>
    </div>
  );
}
