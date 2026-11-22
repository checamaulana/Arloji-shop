"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { signOut } from "firebase/auth";
import { toast } from "sonner";
import { auth } from "@/lib/firebase/client";
import { ChartNoAxesColumn, ClipboardList, Package, Store, LogOut, Watch } from "lucide-react";
import { useChromeSize } from "@/components/ui/design-layout";

const navigation = [
  { href: "/admin", label: "Beranda", icon: ChartNoAxesColumn, exact: true },
  { href: "/admin/pesanan", label: "Pesanan", icon: ClipboardList, exact: false },
  { href: "/admin/barang", label: "Barang", icon: Package, exact: false },
  { href: "/admin/toko", label: "Toko", icon: Store, exact: false },
];

export function AdminNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const nav = useRef<HTMLElement>(null);
  useChromeSize(nav, "bottom");

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const response = await fetch("/api/auth/session", { method: "DELETE" });
      if (!response.ok) throw new Error("Sesi server tidak dapat dihapus.");
      await signOut(auth);
      router.replace("/admin/login");
    } catch (error) {
      console.error("Admin logout failed:", error);
      toast.error("Gagal keluar. Silakan coba lagi.");
      setLoggingOut(false);
    }
  }

  return (
    <>
      <header className="gutter flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface py-2.5">
        <p className="flex min-w-0 items-center gap-2.5 font-bold wrap-anywhere">
          <span className="icon-tile"><Watch aria-hidden="true" /></span> Sultan Arloji
        </p>
        <button type="button" className="action action-ghost" onClick={handleLogout} disabled={loggingOut}>
          <LogOut aria-hidden="true" /> {loggingOut ? "Keluar…" : "Keluar"}
        </button>
      </header>
      {children}
      <nav ref={nav} aria-label="Navigasi admin" className="admin-nav glass fixed bottom-0 left-1/2 z-40 grid -translate-x-1/2 grid-cols-4 items-stretch gap-1 border-t border-border px-2 pt-2 shadow-[0_-4px_16px_rgb(23_18_23/6%)]">
        {navigation.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-center text-xs leading-4 wrap-anywhere ${active ? "bg-brand-tint font-bold text-brand" : "font-medium text-muted-foreground hover:bg-brand-tint hover:text-brand"}`}>
              <Icon size={20} aria-hidden="true" className="shrink-0" /> {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
