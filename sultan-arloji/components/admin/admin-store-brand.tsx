"use client";

import Image from "next/image";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { initialStoreData } from "@/lib/data/initial-data";
import type { StoreDocument } from "@/types/store";

type StoreBrand = Pick<StoreDocument, "name" | "logo_url">;

const AdminStoreBrandContext = createContext<{
  brand: StoreBrand | null;
  setBrand: (brand: StoreBrand) => void;
} | null>(null);

export function AdminStoreBrandProvider({ children }: { children: ReactNode }) {
  const [brand, setBrand] = useState<StoreBrand | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function loadBrand() {
      try {
        const response = await fetch("/api/store", { cache: "no-store", signal: controller.signal });
        if (!response.ok) return;
        const { store } = await response.json() as { store?: StoreBrand };
        if (store && !controller.signal.aborted) {
          setBrand((current) => current ?? store);
        }
      } catch (error) {
        if (!controller.signal.aborted) console.warn("Could not load the store logo:", error);
      }
    }

    void loadBrand();
    return () => controller.abort();
  }, []);

  return <AdminStoreBrandContext.Provider value={{ brand, setBrand }}>{children}</AdminStoreBrandContext.Provider>;
}

export function useAdminStoreBrand() {
  const context = useContext(AdminStoreBrandContext);
  if (!context) throw new Error("Admin store branding requires its provider.");
  return context;
}

export function AdminStoreBrand() {
  const { brand } = useAdminStoreBrand();
  const [failedLogo, setFailedLogo] = useState<string>();
  const name = brand?.name?.trim() || initialStoreData.name;
  const logo = brand?.logo_url?.trim();
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  return (
    <>
      <span aria-hidden="true" className="icon-tile relative overflow-hidden text-xs">
        {logo && logo !== failedLogo ? (
          <Image src={logo} alt="" fill unoptimized sizes="40px" className="object-contain" onError={() => setFailedLogo(logo)} />
        ) : initials}
      </span>
      <span className="min-w-0 wrap-anywhere">{name}</span>
    </>
  );
}
