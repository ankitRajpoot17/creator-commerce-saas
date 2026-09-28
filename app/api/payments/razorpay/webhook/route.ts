import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature");
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!signature || !secret) return NextResponse.json({ error: "Webhook is not configured." }, { status: 400 });

  const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  if (expected !== signature) return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });

  try {
    const event = JSON.parse(raw);
    const payment = event?.payload?.payment?.entity;
    const razorpayOrderId = payment?.order_id;

    if (razorpayOrderId) {
      const order = await prisma.order.findFirst({ where: { providerId: razorpayOrderId } });
      if (order && event.event === "payment.captured") {
        await prisma.order.update({ where: { id: order.id }, data: { status: "PAID", provider: "razorpay", providerId: payment.id } });
      }
      if (order && event.event === "payment.failed") {
        await prisma.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
      }
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }
}
