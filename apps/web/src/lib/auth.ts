import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { connectDB } from "./db";
import { User } from "@/models";

export const AUTH_COOKIE = "vidora_token";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(s);
}

export async function signToken(userId: string) {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
}

export async function verifyToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

export async function setAuthCookie(token: string) {
  (await cookies()).set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearAuthCookie() {
  (await cookies()).delete(AUTH_COOKIE);
}

/** Reads the user id from a Bearer token (mobile) or the auth cookie (web/desktop). */
export async function getUserId(req: NextRequest | Request): Promise<string | null> {
  const header = req.headers.get("authorization");
  if (header?.startsWith("Bearer ")) return verifyToken(header.slice(7));
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  return token ? verifyToken(token) : null;
}

export async function getCurrentUser(req: NextRequest | Request) {
  const id = await getUserId(req);
  if (!id) return null;
  await connectDB();
  return User.findById(id);
}
