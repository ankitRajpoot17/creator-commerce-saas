import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json();
    if (!orderId) return NextResponse.json({ error: "Order id is required." }, { status: 400 });

    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { product: true } });
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    if (order.status !== "PENDING") return NextResponse.json({ error: "Order is no longer payable." }, { status: 409 });

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (order.provider === "razorpay" && order.providerId) return NextResponse.json({ orderId: order.id, razorpayOrderId: order.providerId, amount: order.amount, currency: order.currency, keyId });

    if (!keyId || !keySecret) {
      return NextResponse.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        provider: "razorpay",
        keyId: null,
        mode: "configuration_required",
      });
    }

    const auth = Buffer.from(keyId + ":" + keySecret).toString("base64");
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Basic " + auth },
      body: JSON.stringify({ amount: order.amount, currency: order.currency, receipt: order.id }),
    });
    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: data?.error?.description || "Razorpay order creation failed." }, { status: 502 });

    await prisma.order.update({ where: { id: order.id }, data: { provider: "razorpay", providerId: data.id } });
    return NextResponse.json({ orderId: order.id, razorpayOrderId: data.id, amount: data.amount, currency: data.currency, keyId });
  } catch {
    return NextResponse.json({ error: "Unable to create payment order." }, { status: 500 });
  }
}
