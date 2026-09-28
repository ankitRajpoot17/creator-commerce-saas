import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { createPrivateDownloadUrl } from "@/lib/storage";

export async function GET(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const token = new URL(request.url).searchParams.get("token") || "";
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { product: true } });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (order.status !== "PAID") return NextResponse.json({ error: "Payment required." }, { status: 403 });
  if (!order.product.fileKey) return NextResponse.json({ error: "Private digital file is not configured." }, { status: 404 });
  if (!order.downloadToken || token.length !== order.downloadToken.length || !crypto.timingSafeEqual(Buffer.from(token), Buffer.from(order.downloadToken))) {
    return NextResponse.json({ error: "A valid download token is required." }, { status: 403 });
  }
  try {
    return NextResponse.redirect(await createPrivateDownloadUrl(order.product.fileKey));
  } catch {
    return NextResponse.json({ error: "Private storage is not configured." }, { status: 503 });
  }
}
