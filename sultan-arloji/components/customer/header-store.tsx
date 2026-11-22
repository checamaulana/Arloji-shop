"use client";

import { useState } from "react";
import Image from "next/image";
import type { StoreDocument } from "@/types/store";

export function HeaderStore({ store }: { store: StoreDocument }) {
  const [failedLogo, setFailedLogo] = useState<string>();
  const name = store.name || "Sultan Arloji";
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  return (
    <header className="on-brand gutter border-b-2 border-yellow-action py-5">
      <div className="flex items-start gap-3">
        <div className="relative grid size-13 shrink-0 place-items-center overflow-hidden rounded-full border border-yellow-action bg-brand-strong text-lg font-bold text-yellow-action">
          {store.logo_url && failedLogo !== store.logo_url ? (
            <Image src={store.logo_url} alt="" fill unoptimized sizes="52px" className="object-cover" onError={() => setFailedLogo(store.logo_url)} />
          ) : <span aria-hidden="true">{initials}</span>}
        </div>
        <div className="min-w-0">
          <h1 className="text-[1.625rem] leading-8 wrap-anywhere">{name}</h1>
          {store.bio && <p className="mt-1 text-sm leading-5 wrap-anywhere">{store.bio}</p>}
        </div>
      </div>
    </header>
  );
}
