"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { toast } from "sonner";
import { auth } from "@/lib/firebase/client";
import { BarChart3, ClipboardList, Package, Store, LogOut } from "lucide-react";

const navigation = [
  { href: "/admin", label: "Beranda", icon: BarChart3, exact: true },
  { href: "/admin/pesanan", label: "Pesanan", icon: ClipboardList, exact: false },
  { href: "/admin/barang", label: "Barang", icon: Package, exact: false },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      const response = await fetch("/api/auth/session", { method: "DELETE" });
      if (!response.ok) throw new Error("Sesi server tidak dapat dihapus.");
      await signOut(auth);
      router.replace("/admin/login");
    } catch (error) {
      console.error("Admin logout failed:", error);
      toast.error("Gagal keluar. Silakan coba lagi.");
    }
  }

  return (
    <>
      <div className="flex justify-end px-5 pt-4">
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-neutral-500 transition-colors hover:bg-neutral-900 hover:text-red-400"
        >
          <LogOut className="size-4" />
          Keluar
        </button>
      </div>
      <nav className="fixed bottom-0 left-1/2 z-50 flex w-full max-w-md -translate-x-1/2 items-center justify-around border-t border-neutral-800 bg-[#141414]/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-2xl backdrop-blur">
        {navigation.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-w-14 flex-col items-center gap-1 px-2 py-1 text-[10px] font-medium transition-colors ${
                isActive ? "text-[#D4AF37]" : "text-neutral-500 hover:text-neutral-200"
              }`}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          );
        })}
        <span
          aria-disabled="true"
          title="Pengaturan toko tersedia pada fase berikutnya"
          className="flex min-w-14 flex-col items-center gap-1 px-2 py-1 text-[10px] font-medium text-neutral-700"
        >
          <Store className="size-5" />
          Toko
        </span>
      </nav>
    </>
  );
}
