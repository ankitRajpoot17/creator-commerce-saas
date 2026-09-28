import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPrivateDownloadUrl } from "@/lib/storage";

export async function GET(request: Request) {
  const orderId = new URL(request.url).searchParams.get("orderId");
  if (!orderId) return NextResponse.json({ error: "Order id is required." }, { status: 400 });
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { product: true } });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (order.status !== "PAID") return NextResponse.json({ error: "Paid order required." }, { status: 403 });
  if (!order.product.fileKey) return NextResponse.json({ error: "Private file is not configured." }, { status: 404 });
  try {
    return NextResponse.json({ downloadUrl: await createPrivateDownloadUrl(order.product.fileKey), product: order.product.name, expiresIn: 900 });
  } catch {
    return NextResponse.json({ error: "Private storage is not configured." }, { status: 503 });
  }
}
