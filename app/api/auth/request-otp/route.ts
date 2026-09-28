import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) return NextResponse.json({ error: "Valid email is required." }, { status: 400 });

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  const user = await prisma.user.upsert({ where: { email }, update: {}, create: { email } });

  await prisma.loginCode.deleteMany({ where: { userId: user.id } });
  await prisma.loginCode.create({ data: { userId: user.id, code, expiresAt } });

  const response: { success: boolean; message: string; devCode?: string } = {
    success: true,
    message: "OTP generated. Configure email delivery before production use.",
  };
  if (process.env.NODE_ENV !== "production") response.devCode = code;
  return NextResponse.json(response);
}
