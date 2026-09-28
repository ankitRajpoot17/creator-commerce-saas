import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const SESSION_COOKIE = "creator_session";
const SESSION_DAYS = 30;
const OTP_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;

export async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  await prisma.session.create({ data: { token, userId, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * SESSION_DAYS) } });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 60 * 24 * SESSION_DAYS });
  return token;
}

export async function getCurrentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({ where: { token }, include: { user: { include: { profile: true } } } });
  if (!session || session.expiresAt < new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  return session.user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

export const AUTH_LIMITS = {
  OTP_MINUTES,
  OTP_MAX_ATTEMPTS,
};
