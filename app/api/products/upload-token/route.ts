import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createUploadToken } from "@/lib/storage";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { productId } = await request.json();
  const product = await prisma.product.findUnique({ where: { id: String(productId ?? "") } });
  if (!product || product.creatorId !== user.id) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  return NextResponse.json({ token: createUploadToken(user.id, product.id), expiresIn: 900, storage: process.env.S3_ENDPOINT ? "s3" : "configuration_required" });
}
