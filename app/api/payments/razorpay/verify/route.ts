import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { enrollPaidCourse } from "@/lib/enrollment";
import { activateMembership } from "@/lib/membership";
import { sendEmail, renderEmailBody } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = await request.json();
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret || !orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ error: "Payment verification data is incomplete." }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.providerId !== razorpayOrderId) {
      return NextResponse.json({ error: "Order mismatch." }, { status: 400 });
    }

    const expected = crypto.createHmac("sha256", secret).update(razorpayOrderId + "|" + razorpayPaymentId).digest("hex");
    const keyId = process.env.RAZORPAY_KEY_ID;
    if (!keyId) return NextResponse.json({ error: "Payment provider is not configured." }, { status: 503 });
    const paymentCheck = await fetch("https://api.razorpay.com/v1/payments/" + encodeURIComponent(razorpayPaymentId), { headers: { Authorization: "Basic " + Buffer.from(keyId + ":" + secret).toString("base64") } });
    if (!paymentCheck.ok) return NextResponse.json({ error: "Unable to verify payment with provider." }, { status: 502 });
    if (paymentCheck.ok) {
      const payment = await paymentCheck.json();
      if (payment.order_id !== razorpayOrderId || Number(payment.amount) !== order.amount || String(payment.currency) !== order.currency) return NextResponse.json({ error: "Payment amount or currency mismatch." }, { status: 400 });
    }
    if (expected.length !== razorpaySignature.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpaySignature))) {
      await prisma.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
      return NextResponse.json({ error: "Invalid payment signature." }, { status: 400 });
    }

    if (order.status === "PAID") return NextResponse.json({ success: true, order });

    const paid = await prisma.order.update({
      where: { id: order.id },
      data: { status: "PAID", provider: "razorpay", providerPaymentId: razorpayPaymentId },
    });

    await prisma.analyticsEvent.create({ data: { creatorId: paid.creatorId, type: "SALE", path: "/checkout/" + paid.productId, metadata: JSON.stringify({ orderId: paid.id, productId: paid.productId, amount: paid.amount, currency: paid.currency }) } });

    if (process.env.RESEND_API_KEY && paid.downloadToken) {
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      const downloadUrl = baseUrl.replace(/\/$/, "") + "/api/download/" + paid.id + "?token=" + encodeURIComponent(paid.downloadToken);
      await sendEmail({ to: paid.buyerEmail, subject: "Your purchase is ready", html: "<p>Your payment was successful.</p><p><a href=\"" + renderEmailBody(downloadUrl) + "\">Download your purchase</a></p>" });
    }

    if (paid.productId) {
      await enrollPaidCourse(order.id);
      await activateMembership(order.id);
    }

    return NextResponse.json({ success: true, order: paid });
  } catch {
    return NextResponse.json({ error: "Unable to verify payment." }, { status: 500 });
  }
}
