import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase/admin";

export const ADMIN_SESSION_COOKIE = "__session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 5;

export async function verifyAdminRequest(): Promise<boolean> {
  const sessionCookie = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;

  if (!sessionCookie) {
    return false;
  }

  try {
    await adminAuth.verifySessionCookie(sessionCookie, true);
    return true;
  } catch (error) {
    console.warn("Admin session verification failed:", error);
    return false;
  }
}
