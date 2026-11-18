import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE,
} from "@/lib/auth/verify-admin";
import { adminAuth } from "@/lib/firebase/admin";
import { cookies } from "next/headers";

export async function GET() {
  const sessionCookie = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;

  if (!sessionCookie) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    await adminAuth.verifySessionCookie(sessionCookie, true);
    return NextResponse.json({ authenticated: true });
  } catch (error) {
    console.warn("Could not verify admin session:", error);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const idToken =
      typeof body === "object" && body !== null && "idToken" in body
        ? body.idToken
        : undefined;

    if (typeof idToken !== "string" || !idToken) {
      return NextResponse.json({ error: "Token login tidak valid." }, { status: 400 });
    }

    await adminAuth.verifyIdToken(idToken, true);
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: ADMIN_SESSION_MAX_AGE * 1000,
    });

    const response = NextResponse.json({ success: true });
    response.cookies.set(ADMIN_SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ADMIN_SESSION_MAX_AGE,
    });

    return response;
  } catch (error) {
    console.error("Could not create admin session:", error);
    return NextResponse.json(
      { error: "Login gagal. Periksa email dan kata sandi." },
      { status: 401 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
