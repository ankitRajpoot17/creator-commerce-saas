import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { product: true } });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (order.status !== "PAID") return NextResponse.json({ error: "Payment required." }, { status: 403 });
  if (!order.product.fileUrl) return NextResponse.json({ error: "Digital file is not configured." }, { status: 404 });

  return NextResponse.redirect(order.product.fileUrl);
}
