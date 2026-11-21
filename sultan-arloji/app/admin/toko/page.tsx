"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail,
  updatePassword,
} from "firebase/auth";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { ImagePlus, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { auth, storage } from "@/lib/firebase/client";
import { formatWhatsAppNumber } from "@/lib/utils";
import type { StoreDocument } from "@/types/store";

const MAX_LOGO_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function StoreSettingsPage() {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/store", { cache: "no-store" }).then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Profil toko tidak dapat dimuat.");
        return data.store as StoreDocument;
      }),
    ])
      .then(([store]) => {
        if (!active) return;
        setName(store.name || "");
        setBio(store.bio || "");
        setLogoUrl(store.logo_url || "");
        setWhatsappNumber(store.whatsapp_number || "");
        setEmail(auth.currentUser?.email || "");
      })
      .catch((error: unknown) => {
        if (active) {
          console.error("Could not load store settings:", error);
          toast.error(error instanceof Error ? error.message : "Gagal memuat pengaturan toko.");
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function uploadLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type) || file.size > MAX_LOGO_SIZE) {
      toast.error("Gunakan JPG, PNG, atau WebP dengan ukuran maksimal 5 MB.");
      return;
    }

    setIsUploading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Sesi admin berakhir. Silakan login kembali.");
      const path = `store/logo-${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const result = await uploadBytes(ref(storage, path), file, { contentType: file.type });
      setLogoUrl(await getDownloadURL(result.ref));
      toast.success("Foto profil toko berhasil diunggah.");
    } catch (error) {
      console.error("Could not upload store logo:", error);
      toast.error(error instanceof Error ? error.message : "Gagal mengunggah logo.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      toast.error("Nama toko wajib diisi.");
      return;
    }
    if (!/^62\d{8,14}$/.test(formatWhatsAppNumber(whatsappNumber))) {
      toast.error("Nomor WhatsApp toko tidak valid.");
      return;
    }
    if (newPassword && newPassword.length < 6) {
      toast.error("Kata sandi baru minimal 6 karakter.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/store", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          bio: bio.trim(),
          logo_url: logoUrl.trim(),
          whatsapp_number: formatWhatsAppNumber(whatsappNumber),
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "Pengaturan toko gagal disimpan.");

      const user = auth.currentUser;
      const nextEmail = email.trim();
      if (user && (nextEmail !== (user.email || "") || newPassword)) {
        if (!currentPassword) {
          throw new Error("Masukkan kata sandi saat ini untuk mengubah email atau password.");
        }
        const credential = EmailAuthProvider.credential(user.email || "", currentPassword);
        await reauthenticateWithCredential(user, credential);
        if (nextEmail !== (user.email || "")) {
          await updateEmail(user, nextEmail);
        }
        if (newPassword) {
          await updatePassword(user, newPassword);
        }
      }

      setCurrentPassword("");
      setNewPassword("");
      await user?.getIdToken(true);
      toast.success("Pengaturan toko dan akun admin berhasil disimpan.");
    } catch (error) {
      console.error("Could not save store settings:", error);
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan pengaturan.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <div className="px-5 py-16 text-center text-sm text-neutral-400">Memuat pengaturan toko...</div>;
  }

  return (
    <main className="px-5 pb-8 pt-7">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">Pengaturan</p>
      <h1 className="mt-1 text-2xl font-semibold text-white">Profil Toko</h1>
      <p className="mt-1 text-sm text-neutral-400">Kelola identitas toko dan akun admin.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <section className="space-y-4 rounded-2xl border border-neutral-800 bg-[#171717] p-4">
          <h2 className="text-sm font-semibold text-white">Informasi Toko</h2>
          <div className="flex items-center gap-4">
            <div className="relative size-20 shrink-0 overflow-hidden rounded-full border border-[#D4AF37]/60 bg-neutral-900">
              {logoUrl ? (
                <Image src={logoUrl} alt="Logo toko" fill unoptimized sizes="80px" className="object-cover" />
              ) : (
                <div className="flex size-full items-center justify-center text-2xl font-bold text-[#D4AF37]">S</div>
              )}
            </div>
            <label className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-neutral-700 px-3 text-xs text-neutral-300 hover:border-[#D4AF37]">
              {isUploading ? <LoaderCircle className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
              {isUploading ? "Mengunggah..." : "Pilih logo"}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void uploadLogo(event)} className="sr-only" />
            </label>
          </div>

          <label className="block space-y-2 text-xs font-medium text-neutral-300">
            Nama toko
            <input
              required
              maxLength={160}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-11 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 text-sm text-white outline-none focus:border-[#D4AF37]"
            />
          </label>

          <label className="block space-y-2 text-xs font-medium text-neutral-300">
            Bio toko
            <textarea
              rows={3}
              maxLength={2000}
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
            />
          </label>

          <label className="block space-y-2 text-xs font-medium text-neutral-300">
            Nomor WhatsApp tujuan pesanan
            <input
              required
              inputMode="numeric"
              value={whatsappNumber}
              onChange={(event) => setWhatsappNumber(event.target.value)}
              placeholder="628123456789"
              className="h-11 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 text-sm text-white outline-none focus:border-[#D4AF37]"
            />
            <span className="block text-[10px] font-normal text-neutral-500">Contoh: 08123456789 atau 628123456789</span>
          </label>
        </section>

        <section className="space-y-4 rounded-2xl border border-neutral-800 bg-[#171717] p-4">
          <h2 className="text-sm font-semibold text-white">Akun Admin</h2>
          <label className="block space-y-2 text-xs font-medium text-neutral-300">
            Email admin
            <span className="relative block">
              <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-500" />
              <input
                required
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-11 w-full rounded-xl border border-neutral-800 bg-neutral-950 pl-10 pr-3 text-sm text-white outline-none focus:border-[#D4AF37]"
              />
            </span>
          </label>

          <label className="block space-y-2 text-xs font-medium text-neutral-300">
            Kata sandi saat ini
            <span className="relative block">
              <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-500" />
              <input
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className="h-11 w-full rounded-xl border border-neutral-800 bg-neutral-950 pl-10 pr-3 text-sm text-white outline-none focus:border-[#D4AF37]"
                placeholder="Diperlukan untuk mengubah email/password"
              />
            </span>
          </label>

          <label className="block space-y-2 text-xs font-medium text-neutral-300">
            Kata sandi baru
            <span className="relative block">
              <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-500" />
              <input
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="h-11 w-full rounded-xl border border-neutral-800 bg-neutral-950 pl-10 pr-3 text-sm text-white outline-none focus:border-[#D4AF37]"
                placeholder="Kosongkan jika tidak ingin berubah"
              />
            </span>
          </label>
        </section>

        <Button
          type="submit"
          disabled={isSaving || isUploading}
          className="h-12 w-full rounded-xl bg-[#D4AF37] font-semibold text-black hover:bg-[#F3E5AB]"
        >
          {isSaving ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {isSaving ? "Menyimpan..." : "Simpan Pengaturan"}
        </Button>
      </form>
    </main>
  );
}
