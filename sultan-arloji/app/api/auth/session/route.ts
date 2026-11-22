import { NextResponse } from "next/server";
import { getAdminSession, isAdmin } from "@/lib/auth/verify-admin";
import { createSupabaseSession } from "@/lib/supabase/session";

const headers = { "Cache-Control": "private, no-store" };

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ authenticated: false }, { status: 401, headers });
  return NextResponse.json({ authenticated: true, email: session.user.email ?? "" }, { headers });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (typeof body?.email !== "string" || !body.email.trim() || typeof body?.password !== "string" || !body.password) {
    return NextResponse.json({ error: "Email dan kata sandi wajib diisi." }, { status: 400, headers });
  }

  const supabase = await createSupabaseSession();
  if (!supabase) {
    return NextResponse.json({ error: "Konfigurasi akun admin Supabase belum lengkap." }, { status: 503, headers });
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email: body.email.trim(), password: body.password });
  if (error || !isAdmin(data.user)) {
    if (data.session) await supabase.auth.signOut({ scope: "local" });
    if (error?.status === 429) {
      return NextResponse.json({ error: "Terlalu banyak percobaan. Coba lagi nanti." }, { status: 429, headers });
    }
    if (error && (error.status ?? 500) >= 500) {
      return NextResponse.json({ error: "Layanan masuk sedang tidak tersedia." }, { status: 503, headers });
    }
    return NextResponse.json({ error: "Email atau kata sandi admin salah." }, { status: 401, headers });
  }

  return NextResponse.json({ authenticated: true }, { headers });
}

export async function PATCH(request: Request) {
  const session = await getAdminSession();
  if (!session?.user.email) return NextResponse.json({ error: "Sesi admin tidak valid." }, { status: 401, headers });

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = body?.newPassword;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof password !== "string" || (password && password.length < 6)) {
    return NextResponse.json({ error: "Email atau kata sandi baru tidak valid." }, { status: 400, headers });
  }

  const emailChanged = email !== session.user.email.toLowerCase();
  if (!emailChanged && !password) return NextResponse.json({ success: true, emailConfirmationRequired: false }, { headers });
  if (typeof body.currentPassword !== "string" || !body.currentPassword) {
    return NextResponse.json({ error: "Masukkan kata sandi admin saat ini." }, { status: 400, headers });
  }

  const { supabase, user } = session;
  const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: session.user.email, password: body.currentPassword });
  if (signInError || !isAdmin(data.user) || data.user.id !== user.id) {
    if (data.session) await supabase.auth.signOut({ scope: "local" });
    if (signInError?.status === 429) {
      return NextResponse.json({ error: "Terlalu banyak percobaan. Coba lagi nanti." }, { status: 429, headers });
    }
    return NextResponse.json({ error: "Kata sandi saat ini gagal diverifikasi." }, { status: 401, headers });
  }

  const { data: updated, error } = await supabase.auth.updateUser({
    ...(emailChanged ? { email } : {}),
    ...(password ? { password } : {}),
  });
  if (error) return NextResponse.json({ error: "Akun admin gagal diperbarui. Periksa email dan kata sandi baru." }, { status: 400, headers });
  return NextResponse.json({ success: true, emailConfirmationRequired: emailChanged && updated.user?.email !== email }, { headers });
}

export async function DELETE() {
  const supabase = await createSupabaseSession();
  const { error } = supabase ? await supabase.auth.signOut({ scope: "local" }) : { error: null };
  if (error && error.name !== "AuthSessionMissingError") {
    return NextResponse.json({ error: "Sesi tidak dapat dihapus." }, { status: 503, headers });
  }
  return NextResponse.json({ success: true }, { headers });
}
