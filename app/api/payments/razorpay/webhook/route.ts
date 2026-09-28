import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { enrollPaidCourse } from "@/lib/enrollment";
import { activateMembership } from "@/lib/membership";

export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature");
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!signature || !secret) return NextResponse.json({ error: "Webhook is not configured." }, { status: 400 });
  const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  try {
    const event = JSON.parse(raw);
    const payment = event?.payload?.payment?.entity;
    const razorpayOrderId = payment?.order_id;
    if (razorpayOrderId) {
      const order = await prisma.order.findFirst({ where: { providerId: razorpayOrderId } });
      if (order && event.event === "payment.captured") {
        if (Number(payment.amount) !== order.amount || String(payment.currency) !== order.currency) return NextResponse.json({ error: "Payment amount or currency mismatch." }, { status: 400 });
        if (order.status !== "PAID") {
          await prisma.order.update({ where: { id: order.id }, data: { status: "PAID", provider: "razorpay", providerPaymentId: payment.id } });
          await prisma.analyticsEvent.create({ data: { creatorId: order.creatorId, type: "SALE", path: "/checkout/" + order.productId, metadata: JSON.stringify({ orderId: order.id, productId: order.productId, amount: order.amount, currency: order.currency }) } });
        }
        await enrollPaidCourse(order.id);
        await activateMembership(order.id);
      }
      if (order && event.event === "payment.failed") await prisma.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
    }
    const subscription=event?.payload?.subscription?.entity;
    if(subscription?.id){
      const sub=await prisma.subscription.findFirst({where:{provider:"razorpay",providerSubscriptionId:subscription.id}});
      if(sub){
        const statusMap:Record<string,string>={"subscription.activated":"ACTIVE","subscription.charged":"ACTIVE","subscription.resumed":"ACTIVE","subscription.paused":"PAUSED","subscription.cancelled":"CANCELLED","subscription.completed":"EXPIRED"};
        const nextStatus=statusMap[event.event];
        if(nextStatus){
          const currentEnd=Number(subscription.current_end||0);
          await prisma.subscription.update({where:{id:sub.id},data:{status:nextStatus,currentPeriodEnd:currentEnd?new Date(currentEnd*1000):sub.currentPeriodEnd}});
        }
      }
    }
    return NextResponse.json({ received: true });
  } catch { return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 }); }
}