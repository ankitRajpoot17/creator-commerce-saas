import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, include: { product: true } });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  return NextResponse.json({
    id: order.id,
    status: order.status,
    product: { id: order.product.id, name: order.product.name },
    amount: order.amount,
    currency: order.currency,
  });
}
