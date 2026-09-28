import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
 const b=await req.json();
 const bookingId=String(b.bookingId||""),paymentId=String(b.razorpay_payment_id||""),orderId=String(b.razorpay_order_id||""),signature=String(b.razorpay_signature||"");
 const booking=await prisma.booking.findUnique({where:{id:bookingId}});
 if(!booking)return NextResponse.json({error:"Booking not found."},{status:404});
 if(booking.status==="PAID")return NextResponse.json({success:true,booking});
 if(!booking.providerOrderId||booking.providerOrderId!==orderId)return NextResponse.json({error:"Payment order mismatch."},{status:400});
 const secret=process.env.RAZORPAY_KEY_SECRET;
 if(!secret)return NextResponse.json({error:"Payment verification is not configured."},{status:503});
 const expected=crypto.createHmac("sha256",secret).update(orderId+"|"+paymentId).digest("hex");
 if(signature.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(signature),Buffer.from(expected)))return NextResponse.json({error:"Invalid payment signature."},{status:400});
 const updated=await prisma.booking.update({where:{id:booking.id},data:{status:"PAID",providerPaymentId:paymentId}});
 const creator=await prisma.user.findUnique({where:{id:updated.creatorId}});
 if(process.env.RESEND_API_KEY){
  const when=(await prisma.booking.findUnique({where:{id:updated.id},include:{slot:true}}))?.slot.startAt.toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"});
  await sendEmail({to:updated.customerEmail,subject:"Booking confirmed",html:"<div><p>Your payment was successful.</p><p>Your session is confirmed for "+when+".</p></div>"});
  if(creator?.email) await sendEmail({to:creator.email,subject:"Paid booking confirmed",html:"<div><p>A paid booking has been confirmed.</p><p>Customer: "+updated.customerEmail+"</p><p>Time: "+when+"</p></div>"});
 }
 return NextResponse.json({success:true,booking:updated});
}