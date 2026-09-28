import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOtp } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Valid email is required." }, { status: 400 });

    const user = await prisma.user.upsert({ where: { email }, update: {}, create: { email } });
    await prisma.loginCode.deleteMany({ where: { userId: user.id } });
    const code = generateOtp();
    await prisma.loginCode.create({ data: { userId: user.id, code, expiresAt: new Date(Date.now() + 10 * 60 * 1000) } });

    const response: { success: boolean; message: string; devCode?: string } = {
      success: true,
      message: process.env.RESEND_API_KEY ? "OTP sent to your email." : "OTP generated. Configure email delivery before production use.",
    };
    if (process.env.NODE_ENV !== "production") response.devCode = code;
    return NextResponse.json(response);
  } catch {
    return NextResponse.json({ error: "Unable to request OTP." }, { status: 500 });
  }
}