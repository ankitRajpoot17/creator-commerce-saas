import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const jar = await cookies();
  const token = jar.get("creator_session")?.value;
  if (token) await prisma.session.deleteMany({ where: { token } });
  jar.delete("creator_session");
  return NextResponse.json({ success: true });
}
