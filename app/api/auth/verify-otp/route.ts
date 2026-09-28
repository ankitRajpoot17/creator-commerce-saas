import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body.email ?? "").trim().toLowerCase();
  const code = String(body.code ?? "").trim();
  if (!email || !code) return NextResponse.json({ error: "Email and OTP are required." }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });
  const loginCode = await prisma.loginCode.findFirst({ where: { userId: user.id, code }, orderBy: { createdAt: "desc" } });
  if (!loginCode || loginCode.expiresAt < new Date()) return NextResponse.json({ error: "Invalid or expired OTP." }, { status: 401 });

  await prisma.loginCode.delete({ where: { id: loginCode.id } });
  await createSession(user.id);
  return NextResponse.json({ success: true, user: { id: user.id, email: user.email, profile: user.profile } });
}
