"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { KeyRound, LoaderCircle, Mail } from "lucide-react";
import { toast } from "sonner";
import { auth } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const idToken = await credential.user.getIdToken();
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error || "Sesi admin tidak dapat dibuat.");
      }

      toast.success("Login berhasil.");
      router.replace("/admin");
    } catch (error) {
      console.error("Admin login failed:", error);
      toast.error(
        error instanceof Error ? error.message : "Email atau kata sandi tidak valid."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center px-6 py-10">
      <section className="w-full rounded-3xl border border-neutral-800 bg-[#171717] p-6 shadow-2xl">
        <div className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">
            Sultan Arloji
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Login Admin</h1>
          <p className="mt-2 text-sm text-neutral-400">
            Masuk untuk mengelola produk dan pesanan toko.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-2 text-xs font-medium text-neutral-300">
            Email
            <span className="relative block">
              <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-500" />
              <input
                required
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-11 w-full rounded-xl border border-neutral-800 bg-neutral-950 pl-10 pr-3 text-sm text-white outline-none focus:border-[#D4AF37]"
                placeholder="admin@example.com"
              />
            </span>
          </label>

          <label className="block space-y-2 text-xs font-medium text-neutral-300">
            Kata sandi
            <span className="relative block">
              <KeyRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-500" />
              <input
                required
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-11 w-full rounded-xl border border-neutral-800 bg-neutral-950 pl-10 pr-3 text-sm text-white outline-none focus:border-[#D4AF37]"
                placeholder="Kata sandi"
              />
            </span>
          </label>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-11 w-full rounded-xl bg-[#D4AF37] font-semibold text-black hover:bg-[#F3E5AB]"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                Memeriksa...
              </>
            ) : (
              "Masuk"
            )}
          </Button>
        </form>
      </section>
    </main>
  );
}
