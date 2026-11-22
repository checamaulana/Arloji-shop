"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Image from "next/image";
import { EmailAuthProvider, reauthenticateWithCredential, updateEmail, updatePassword } from "firebase/auth";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { ImagePlus, LoaderCircle, Store } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { auth, storage } from "@/lib/firebase/client";
import { formatWhatsAppNumber } from "@/lib/utils";
import type { StoreDocument } from "@/types/store";

const MAX_LOGO_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
type Notice = { text: string; error?: boolean };

function SettingsNotice({ notice }: { notice?: Notice }) {
  return <p role="status" className={notice ? `notice ${notice.error ? "notice-error" : "notice-success"}` : "sr-only"}>{notice?.text}</p>;
}

export default function StoreSettingsPage() {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [brokenLogo, setBrokenLogo] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [logoNotice, setLogoNotice] = useState<Notice>();
  const [profileNotice, setProfileNotice] = useState<Notice>();
  const [accountNotice, setAccountNotice] = useState<Notice>();
  const [errors, setErrors] = useState<Partial<Record<"name" | "whatsapp" | "newPassword" | "currentPassword", string>>>({});
  const operation = useRef<"upload" | "save" | null>(null);
  const passwordInput = useRef<HTMLInputElement>(null);
  const busy = isUploading || isSaving;

  useEffect(() => {
    let active = true;
    async function loadSettings() {
      try {
        const response = await fetch("/api/store", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Profil toko tidak dapat dimuat.");
        if (!active) return;
        const store = data.store as StoreDocument;
        setName(store.name || "");
        setBio(store.bio || "");
        setLogoUrl(store.logo_url || "");
        setWhatsappNumber(store.whatsapp_number || "");
        setEmail(auth.currentUser?.email || "");
      } catch (error) {
        console.error("Could not load store settings:", error);
        if (active) setLoadError(error instanceof Error ? error.message : "Gagal memuat pengaturan toko.");
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void loadSettings();
    return () => { active = false; };
  }, []);

  async function uploadLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || operation.current) return;
    if (!ACCEPTED_TYPES.includes(file.type) || file.size > MAX_LOGO_SIZE) {
      setLogoNotice({ text: "Gunakan JPG, PNG, atau WebP dengan ukuran maksimal 5 MB.", error: true });
      return;
    }

    operation.current = "upload";
    setLogoNotice(undefined);
    setIsUploading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Sesi admin berakhir. Silakan masuk kembali.");
      const path = `store/logo-${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const result = await uploadBytes(ref(storage, path), file, { contentType: file.type });
      setLogoUrl(await getDownloadURL(result.ref));
      setLogoNotice({ text: "Logo berhasil diunggah. Simpan pengaturan untuk menerapkannya." });
    } catch (error) {
      console.error("Could not upload store logo:", error);
      setLogoNotice({ text: error instanceof Error ? error.message : "Gagal mengunggah logo.", error: true });
    } finally {
      operation.current = null;
      setIsUploading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (operation.current) return;

    const nextErrors: typeof errors = {};
    if (!name.trim()) nextErrors.name = "Nama toko wajib diisi.";
    if (!/^62\d{8,14}$/.test(formatWhatsAppNumber(whatsappNumber))) nextErrors.whatsapp = "Nomor WhatsApp toko tidak valid.";
    if (newPassword && newPassword.length < 6) nextErrors.newPassword = "Kata sandi baru minimal 6 karakter.";
    setErrors(nextErrors);
    const firstInvalid = Object.keys(nextErrors)[0];
    if (firstInvalid) {
      event.currentTarget.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }

    operation.current = "save";
    setProfileNotice(undefined);
    setAccountNotice(undefined);
    setIsSaving(true);
    let profileSaved = false;
    let emailUpdated = false;
    let passwordUpdated = false;
    let accountRequested = false;

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

      profileSaved = true;
      setProfileNotice({ text: "Informasi toko berhasil disimpan." });
      setLogoNotice(undefined);

      const user = auth.currentUser;
      const nextEmail = email.trim();
      accountRequested = nextEmail !== (user?.email || "") || Boolean(newPassword);
      if (accountRequested && !user) {
        setAccountNotice({ text: "Sesi Firebase berakhir. Masuk kembali untuk mengubah akun admin.", error: true });
        return;
      }
      if (user && accountRequested) {
        if (!currentPassword) {
          setErrors({ currentPassword: "Masukkan kata sandi saat ini untuk mengubah email atau kata sandi." });
          passwordInput.current?.focus();
          return;
        }
        const credential = EmailAuthProvider.credential(user.email || "", currentPassword);
        await reauthenticateWithCredential(user, credential);
        if (nextEmail !== (user.email || "")) {
          await updateEmail(user, nextEmail);
          emailUpdated = true;
        }
        if (newPassword) {
          await updatePassword(user, newPassword);
          passwordUpdated = true;
        }
      }

      setCurrentPassword("");
      setNewPassword("");
      await user?.getIdToken(true);
      if (accountRequested) setAccountNotice({ text: "Perubahan akun admin berhasil disimpan." });
    } catch (error) {
      console.error("Could not save store settings:", error);
      const message = error instanceof Error ? error.message : "Gagal menyimpan pengaturan.";
      if (!profileSaved) setProfileNotice({ text: message, error: true });
      else {
        const saved = emailUpdated && passwordUpdated ? "Email dan kata sandi sudah diperbarui. " : emailUpdated ? "Email sudah diperbarui. " : passwordUpdated ? "Kata sandi sudah diperbarui. " : "";
        setAccountNotice({ text: saved + message, error: true });
      }
    } finally {
      operation.current = null;
      setIsSaving(false);
    }
  }

  return (
    <div className="page">
      <h1>Toko</h1>
      {isLoading ? (
        <section className="card mt-4 space-y-4 p-4" aria-busy="true">
          <p role="status" className="sr-only">Memuat pengaturan toko…</p>
          <Skeleton className="size-16 rounded-full" aria-hidden="true" />
          <Skeleton className="h-11 w-full" aria-hidden="true" />
          <Skeleton className="h-24 w-full" aria-hidden="true" />
        </section>
      ) : loadError ? (
        <p role="alert" className="notice notice-error mt-4">{loadError}</p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <section className="card space-y-4 p-4" aria-labelledby="store-information">
            <h2 id="store-information">Informasi toko</h2>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-brand-tint text-brand">
                {logoUrl && logoUrl !== brokenLogo ? (
                  <Image src={logoUrl} alt="Logo toko" fill unoptimized sizes="64px" className="object-cover" onError={() => setBrokenLogo(logoUrl)} />
                ) : <Store size={24} aria-hidden="true" />}
              </div>
              <label className="action action-secondary relative cursor-pointer focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand has-disabled:cursor-default has-disabled:bg-muted">
                {isUploading ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <ImagePlus aria-hidden="true" />}
                {isUploading ? "Mengunggah logo…" : "Pilih logo"}
                <input type="file" accept={ACCEPTED_TYPES.join(",")} disabled={busy} onChange={(event) => void uploadLogo(event)} className="sr-only" aria-describedby="logo-requirements" />
              </label>
            </div>
            <p className="text-sm text-muted-foreground" id="logo-requirements">JPG, PNG, atau WebP. Maksimal 5 MB.</p>
            <SettingsNotice notice={logoNotice} />

            <label className="field-label" htmlFor="store-name">Nama toko
              <input id="store-name" name="name" className="field" required maxLength={160} value={name} onChange={(event) => { setName(event.target.value); setErrors((current) => ({ ...current, name: undefined })); }} aria-invalid={!!errors.name} aria-describedby={errors.name ? "store-name-error" : undefined} />
              {errors.name && <span className="field-error" id="store-name-error">{errors.name}</span>}
            </label>
            <label className="field-label" htmlFor="store-bio">Bio toko
              <textarea id="store-bio" className="field" rows={3} maxLength={2000} value={bio} onChange={(event) => setBio(event.target.value)} />
            </label>
            <label className="field-label" htmlFor="store-whatsapp">Nomor WhatsApp tujuan pesanan
              <input id="store-whatsapp" name="whatsapp" className="field" required type="tel" autoComplete="tel" value={whatsappNumber} onChange={(event) => { setWhatsappNumber(event.target.value); setErrors((current) => ({ ...current, whatsapp: undefined })); }} aria-invalid={!!errors.whatsapp} aria-describedby={errors.whatsapp ? "store-phone-hint store-phone-error" : "store-phone-hint"} />
              <span className="font-normal text-muted-foreground" id="store-phone-hint">Contoh 08123456789 atau 628123456789</span>
              {errors.whatsapp && <span className="field-error" id="store-phone-error">{errors.whatsapp}</span>}
            </label>
            <SettingsNotice notice={profileNotice} />
          </section>

          <section className="card space-y-4 p-4" aria-labelledby="store-account">
            <h2 id="store-account">Akun admin</h2>
            <label className="field-label" htmlFor="store-email">Email admin
              <input id="store-email" className="field" required type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label className="field-label" htmlFor="store-password">Kata sandi saat ini
              <input id="store-password" ref={passwordInput} className="field" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => { setCurrentPassword(event.target.value); setErrors((current) => ({ ...current, currentPassword: undefined })); }} aria-invalid={!!errors.currentPassword} aria-describedby={errors.currentPassword ? "store-password-hint store-password-error" : "store-password-hint"} />
              <span className="font-normal text-muted-foreground" id="store-password-hint">Diperlukan untuk mengubah email atau kata sandi.</span>
              {errors.currentPassword && <span className="field-error" id="store-password-error">{errors.currentPassword}</span>}
            </label>
            <label className="field-label" htmlFor="store-new-password">Kata sandi baru
              <input id="store-new-password" name="newPassword" className="field" type="password" autoComplete="new-password" value={newPassword} onChange={(event) => { setNewPassword(event.target.value); setErrors((current) => ({ ...current, newPassword: undefined })); }} aria-invalid={!!errors.newPassword} aria-describedby={errors.newPassword ? "store-new-password-error" : undefined} />
              {errors.newPassword && <span className="field-error" id="store-new-password-error">{errors.newPassword}</span>}
            </label>
            <SettingsNotice notice={accountNotice} />
          </section>

          <button type="submit" disabled={busy} className="action action-primary w-full">
            {isSaving && <LoaderCircle className="animate-spin" aria-hidden="true" />}
            {isSaving ? "Menyimpan…" : "Simpan pengaturan"}
          </button>
        </form>
      )}
    </div>
  );
}
