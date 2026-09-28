import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPrivateFileKey, createUploadUrl, storageConfigured } from "@/lib/storage";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!storageConfigured()) return NextResponse.json({ error: "Private storage is not configured." }, { status: 503 });

  const body = await request.json();
  const productId = String(body.productId ?? "");
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || product.creatorId !== user.id) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  if (product.type !== "DIGITAL") return NextResponse.json({ error: "Only digital products support file uploads." }, { status: 400 });

  const filename = String(body.filename ?? "file");
  const contentType = String(body.contentType ?? "application/octet-stream");
  const key = createPrivateFileKey(user.id, product.id, filename);
  const uploadUrl = await createUploadUrl(key, contentType);
  return NextResponse.json({ uploadUrl, key, expiresIn: 900 });
}