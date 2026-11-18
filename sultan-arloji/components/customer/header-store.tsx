"use client";

import React from "react";
import Image from "next/image";
import { StoreDocument } from "@/types/store";
import { ShieldCheck, Sparkles, Clock } from "lucide-react";

interface HeaderStoreProps {
  store: StoreDocument;
}

export function HeaderStore({ store }: HeaderStoreProps) {
  return (
    <header className="relative w-full border-b border-neutral-800/80 bg-gradient-to-b from-neutral-900 via-[#111111] to-[#0B0B0B] px-4 pt-6 pb-5 text-neutral-100">
      {/* Ambient Gold Glow Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-12 bg-[#D4AF37]/10 blur-2xl pointer-events-none rounded-full" />

      <div className="relative flex items-center gap-3.5">
        {/* Avatar Logo */}
        <div className="relative size-14 shrink-0 rounded-full p-0.5 bg-gradient-to-tr from-[#997929] via-[#D4AF37] to-[#F3E5AB] shadow-md shadow-amber-500/10">
          <div className="relative size-full rounded-full overflow-hidden bg-neutral-900 flex items-center justify-center">
            {store.logo_url ? (
              <img
                src={store.logo_url}
                alt={store.name}
                className="size-full object-cover"
              />
            ) : (
              <span className="text-xl font-bold tracking-tight text-[#D4AF37]">
                S
              </span>
            )}
          </div>
          {/* Online status indicator dot */}
          <span className="absolute bottom-0 right-0 size-3.5 rounded-full bg-emerald-500 border-2 border-[#0B0B0B]" />
        </div>

        {/* Store Title & Status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h1 className="text-lg font-bold tracking-tight text-white truncate">
              {store.name || "Sultan Arloji"}
            </h1>
            <ShieldCheck className="size-4 text-[#D4AF37] shrink-0" />
          </div>

          <div className="flex items-center gap-2 mt-0.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Online & Siap Melayani
            </span>
            <span className="text-neutral-600">•</span>
            <span className="text-[11px] text-[#D4AF37]/90 font-medium flex items-center gap-0.5">
              <Sparkles className="size-3" />
              Authentic Luxury
            </span>
          </div>

          <p className="text-xs text-neutral-400 line-clamp-1 mt-1 leading-relaxed">
            {store.bio || "Koleksi jam tangan mewah original dengan garansi terpercaya."}
          </p>
        </div>
      </div>

      {/* Trust Badges Bar */}
      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-neutral-800/60 pt-3 text-[11px] text-neutral-300">
        <div className="flex items-center justify-center gap-1 text-center bg-neutral-900/60 py-1 px-1.5 rounded-lg border border-neutral-800/40">
          <ShieldCheck className="size-3 text-[#D4AF37]" />
          <span>100% Original</span>
        </div>
        <div className="flex items-center justify-center gap-1 text-center bg-neutral-900/60 py-1 px-1.5 rounded-lg border border-neutral-800/40">
          <Clock className="size-3 text-[#D4AF37]" />
          <span>Fast Response</span>
        </div>
        <div className="flex items-center justify-center gap-1 text-center bg-neutral-900/60 py-1 px-1.5 rounded-lg border border-neutral-800/40">
          <Sparkles className="size-3 text-[#D4AF37]" />
          <span>Free Ongkir</span>
        </div>
      </div>
    </header>
  );
}
