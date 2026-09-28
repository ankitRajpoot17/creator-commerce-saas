import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOtp } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Valid email is required." }, { status: 400 });

    const user = await prisma.user.upsert({ where: { email }, update: {}, create: { email } });
    const recent = await prisma.loginCode.count({ where: { userId: user.id, createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) } } });
    if (recent >= 5) return NextResponse.json({ error: "Too many OTP requests. Try again later." }, { status: 429 });
    await prisma.loginCode.deleteMany({ where: { userId: user.id } });
    const code = generateOtp();
    await prisma.loginCode.create({ data: { userId: user.id, code, expiresAt: new Date(Date.now() + 10 * 60 * 1000) } });

    let delivered = false;
    if (process.env.RESEND_API_KEY) {
      const result = await sendEmail({ to: email, subject: "Creator Commerce login code", html: "<p>Your login code is <strong>" + code + "</strong>.</p><p>This code expires in 10 minutes.</p>" });
      delivered = result.sent;
    }

    const response: { success: boolean; message: string; devCode?: string } = {
      success: true,
      message: delivered ? "OTP sent to your email." : "OTP generated. Configure email delivery before production use.",
    };
    if (process.env.NODE_ENV !== "production") response.devCode = code;
    return NextResponse.json(response);
  } catch {
    return NextResponse.json({ error: "Unable to request OTP." }, { status: 500 });
  }
}