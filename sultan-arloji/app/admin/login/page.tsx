"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { LoaderCircle, Watch } from "lucide-react";
import { toast } from "sonner";
import { auth } from "@/lib/firebase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const errorRef = useRef<HTMLParagraphElement>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setNotice("");

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

      toast.success("Berhasil masuk.");
      router.replace("/admin");
    } catch (error) {
      console.error("Admin login failed:", error);
      const code = (error as { code?: string })?.code;
      const invalidCredentials = code && ["auth/invalid-credential", "auth/invalid-login-credentials", "auth/user-not-found", "auth/wrong-password"].includes(code);
      setNotice(invalidCredentials ? "Email atau kata sandi salah." : code ? "Tidak dapat masuk. Silakan coba lagi." : error instanceof Error ? error.message : "Tidak dapat masuk. Silakan coba lagi.");
      requestAnimationFrame(() => errorRef.current?.focus());
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main id="konten" tabIndex={-1} className="app-shell gutter flex flex-col justify-center bg-surface py-8">
      <div className="on-brand rounded-3xl p-4 shadow-sm">
        <div className="glass flex items-center gap-3 rounded-2xl p-3 font-bold text-brand">
          <span className="icon-tile"><Watch aria-hidden="true" /></span> Sultan Arloji
        </div>
      </div>
      <section className="card mt-4 p-4 min-[360px]:p-5" aria-labelledby="login-title">
        <h1 id="login-title">Masuk ke panel admin</h1>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="field-label" htmlFor="login-email">Email
            <input id="login-email" required type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} className="field" />
          </label>
          <label className="field-label" htmlFor="login-password">Kata sandi
            <input id="login-password" required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="field" />
          </label>
          {notice && <p ref={errorRef} tabIndex={-1} className="notice notice-error">{notice}</p>}
          <button type="submit" disabled={isSubmitting} className="action action-primary w-full">
            {isSubmitting && <LoaderCircle className="animate-spin" aria-hidden="true" />}
            {isSubmitting ? "Memeriksa…" : "Masuk"}
          </button>
        </form>
      </section>
    </main>
  );
}
