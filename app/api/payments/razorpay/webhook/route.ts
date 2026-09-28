import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { enrollPaidCourse } from "@/lib/enrollment";
import { activateMembership } from "@/lib/membership";
import { sendEmail, renderEmailBody } from "@/lib/email";

export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature");
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!signature || !secret) return NextResponse.json({ error: "Webhook is not configured." }, { status: 400 });
  const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  let webhookId="";
  try {
    const event = JSON.parse(raw);
    const eventType=String(event?.event||"unknown");
    webhookId=String(event?.id||crypto.createHash("sha256").update(raw).digest("hex"));
    const payloadHash=crypto.createHash("sha256").update(raw).digest("hex");
    const existing=await prisma.webhookEvent.findUnique({where:{provider_eventId:{provider:"razorpay",eventId:webhookId}}});
    if(existing?.status==="PROCESSED")return NextResponse.json({received:true,duplicate:true});
    if(existing?.status==="PROCESSING")return NextResponse.json({received:true,duplicate:true});
    if(existing)await prisma.webhookEvent.update({where:{id:existing.id},data:{status:"PROCESSING",payloadHash,eventType}});
    else await prisma.webhookEvent.create({data:{provider:"razorpay",eventId:webhookId,eventType,payloadHash,status:"PROCESSING"}});

    const payment = event?.payload?.payment?.entity;
    const razorpayOrderId = payment?.order_id;
    if (razorpayOrderId) {
      const order = await prisma.order.findFirst({ where: { providerId: razorpayOrderId } });
      if (order && eventType === "payment.captured") {
        if (Number(payment.amount) !== order.amount || String(payment.currency) !== order.currency) { await prisma.webhookEvent.updateMany({where:{provider:"razorpay",eventId:webhookId},data:{status:"FAILED"}}); return NextResponse.json({ error: "Payment amount or currency mismatch." }, { status: 400 }); }
        if (order.status !== "PAID" && order.status !== "REFUNDED") {
          await prisma.order.update({ where: { id: order.id }, data: { status: "PAID", provider: "razorpay", providerPaymentId: payment.id } });
          await prisma.analyticsEvent.create({ data: { creatorId: order.creatorId, type: "SALE", path: "/checkout/" + order.productId, metadata: JSON.stringify({ orderId: order.id, productId: order.productId, amount: order.amount, currency: order.currency }) } });
          if (process.env.RESEND_API_KEY && order.downloadToken) { const baseUrl=process.env.NEXTAUTH_URL||"http://localhost:3000"; const downloadUrl=baseUrl.replace(/\/$/,"")+"/api/download/"+order.id+"?token="+encodeURIComponent(order.downloadToken); await sendEmail({to:order.buyerEmail,subject:"Your purchase is ready",html:"<p>Your payment was successful.</p><p><a href=\""+renderEmailBody(downloadUrl)+"\">Download your purchase</a></p>"}); }
        }
        await enrollPaidCourse(order.id);
        await activateMembership(order.id);
      }
      if (order && eventType === "payment.failed") await prisma.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
      if (order && eventType === "refund.processed") {
        await prisma.order.update({ where:{id:order.id},data:{status:"REFUNDED"}});
      }
    }
    const subscription=event?.payload?.subscription?.entity;
    if(subscription?.id){
      const sub=await prisma.subscription.findFirst({where:{provider:"razorpay",providerSubscriptionId:subscription.id}});
      if(sub){
        const statusMap:Record<string,string>={"subscription.activated":"ACTIVE","subscription.charged":"ACTIVE","subscription.resumed":"ACTIVE","subscription.paused":"PAUSED","subscription.cancelled":"CANCELLED","subscription.completed":"EXPIRED"};
        const nextStatus=statusMap[eventType];
        if(nextStatus){
          const currentEnd=Number(subscription.current_end||0);
          await prisma.subscription.update({where:{id:sub.id},data:{status:nextStatus,currentPeriodEnd:currentEnd?new Date(currentEnd*1000):sub.currentPeriodEnd}});
        }
      }
    }
    await prisma.webhookEvent.update({where:{provider_eventId:{provider:"razorpay",eventId:webhookId}},data:{status:"PROCESSED",processedAt:new Date()}});
    return NextResponse.json({ received: true });
  } catch {
    if(webhookId)await prisma.webhookEvent.updateMany({where:{provider:"razorpay",eventId:webhookId},data:{status:"FAILED"}}).catch(()=>undefined);
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }
}