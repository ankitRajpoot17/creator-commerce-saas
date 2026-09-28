import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
 const b=await req.json(); const bookingId=String(b.bookingId||"");
 const booking=await prisma.booking.findUnique({where:{id:bookingId},include:{slot:true,creator:true}});
 if(!booking)return NextResponse.json({error:"Booking not found."},{status:404});
 if(booking.status!=="PENDING")return NextResponse.json({error:"Booking is not payable."},{status:409});
 if(booking.amount<=0)return NextResponse.json({free:true,bookingId:booking.id});
 const key=process.env.RAZORPAY_KEY_ID,secret=process.env.RAZORPAY_KEY_SECRET;
 if(!key||!secret)return NextResponse.json({error:"Razorpay is not configured."},{status:503});
 const auth=Buffer.from(key+":"+secret).toString("base64");
 const response=await fetch("https://api.razorpay.com/v1/orders",{method:"POST",headers:{Authorization:"Basic "+auth,"Content-Type":"application/json"},body:JSON.stringify({amount:booking.amount,currency:booking.currency,receipt:"booking_"+booking.id})});
 if(!response.ok)return NextResponse.json({error:"Unable to create payment order."},{status:502});
 const order=await response.json();
 await prisma.booking.update({where:{id:booking.id},data:{provider:"razorpay",providerOrderId:order.id}});
 return NextResponse.json({keyId:key,orderId:order.id,amount:booking.amount,currency:booking.currency,bookingId:booking.id});
}