import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = await request.json();
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret || !orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ error: "Payment verification data is incomplete." }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.providerId !== razorpayOrderId) return NextResponse.json({ error: "Order mismatch." }, { status: 400 });

    const expected = crypto.createHmac("sha256", secret).update(razorpayOrderId + "|" + razorpayPaymentId).digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpaySignature))) {
      await prisma.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
      return NextResponse.json({ error: "Invalid payment signature." }, { status: 400 });
    }

    const paid = await prisma.order.update({
      where: { id: order.id },
      data: { status: "PAID", provider: "razorpay", providerId: razorpayPaymentId },
    });
    return NextResponse.json({ success: true, order: paid });
  } catch {
    return NextResponse.json({ error: "Unable to verify payment." }, { status: 500 });
  }
}
