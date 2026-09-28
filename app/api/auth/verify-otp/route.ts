import {rateLimit,requestKey} from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, AUTH_LIMITS } from "@/lib/auth";

export async function POST(request: Request) {
    const rl=await rateLimit(requestKey(request,"otp-verify"),20,60); if(!rl.allowed)return NextResponse.json({error:"Too many verification attempts."},{status:429});
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const code = String(body.code ?? "").trim();
    if (!email || !/^\d{6}$/.test(code)) return NextResponse.json({ error: "Email and a 6-digit OTP are required." }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });

    const loginCode = await prisma.loginCode.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
    if (!loginCode || loginCode.expiresAt < new Date()) {
      if (loginCode) await prisma.loginCode.delete({ where: { id: loginCode.id } }).catch(() => undefined);
      return NextResponse.json({ error: "Invalid or expired OTP." }, { status: 401 });
    }

    if (loginCode.attempts >= AUTH_LIMITS.OTP_MAX_ATTEMPTS) {
      await prisma.loginCode.delete({ where: { id: loginCode.id } });
      return NextResponse.json({ error: "Too many OTP attempts. Request a new code." }, { status: 429 });
    }

    if (loginCode.code !== code) {
      const updated = await prisma.loginCode.update({ where: { id: loginCode.id }, data: { attempts: { increment: 1 } } });
      if (updated.attempts >= AUTH_LIMITS.OTP_MAX_ATTEMPTS) await prisma.loginCode.delete({ where: { id: loginCode.id } });
      return NextResponse.json({ error: "Invalid or expired OTP." }, { status: 401 });
    }

    await prisma.loginCode.delete({ where: { id: loginCode.id } });
    await createSession(user.id);
    return NextResponse.json({ success: true, user: { id: user.id, email: user.email, profile: user.profile } });
  } catch {
    return NextResponse.json({ error: "Unable to verify OTP." }, { status: 500 });
  }
}