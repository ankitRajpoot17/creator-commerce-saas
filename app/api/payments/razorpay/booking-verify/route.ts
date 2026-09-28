import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

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
 return NextResponse.json({success:true,booking:updated});
}