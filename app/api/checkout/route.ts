import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { productId, buyerEmail } = await request.json();
    if (!productId || !buyerEmail) return NextResponse.json({ error: "Product and buyer email are required." }, { status: 400 });
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.status !== "PUBLISHED") return NextResponse.json({ error: "Product not available." }, { status: 404 });
    const order = await prisma.order.create({
      data: { productId: product.id, creatorId: product.creatorId, buyerEmail: String(buyerEmail).trim().toLowerCase(), amount: product.price, currency: product.currency },
    });
    return NextResponse.json({ order, checkout: { provider: "razorpay", mode: "pending", message: "Connect Razorpay keys to create the live payment order." } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to create checkout." }, { status: 500 });
  }
}
