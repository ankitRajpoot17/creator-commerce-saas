import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const b=await req.json();
  const bookingId=String(b.bookingId||"");
  const booking=await prisma.booking.findUnique({where:{id:bookingId},include:{slot:true}});
  if(!booking)return NextResponse.json({error:"Booking not found."},{status:404});
  if(booking.status!=="PENDING")return NextResponse.json({error:"Booking is not payable."},{status:409});
  if(booking.slot.startAt<=new Date())return NextResponse.json({error:"This booking slot has already started."},{status:409});
  if(booking.amount<=0)return NextResponse.json({free:true,bookingId:booking.id});
  const key=process.env.RAZORPAY_KEY_ID,secret=process.env.RAZORPAY_KEY_SECRET;
  if(!key||!secret)return NextResponse.json({error:"Razorpay is not configured."},{status:503});
  if(booking.provider==="razorpay"&&booking.providerOrderId)return NextResponse.json({keyId:key,orderId:booking.providerOrderId,amount:booking.amount,currency:booking.currency,bookingId:booking.id});
  const auth=Buffer.from(key+":"+secret).toString("base64");
  const response=await fetch("https://api.razorpay.com/v1/orders",{method:"POST",headers:{Authorization:"Basic "+auth,"Content-Type":"application/json"},body:JSON.stringify({amount:booking.amount,currency:booking.currency,receipt:"booking_"+booking.id})});
  const data=await response.json();
  if(!response.ok)return NextResponse.json({error:data?.error?.description||"Unable to create payment order."},{status:502});
  if(Number(data.amount)!==booking.amount||String(data.currency)!==booking.currency)return NextResponse.json({error:"Payment provider returned an unexpected amount or currency."},{status:502});
  await prisma.booking.update({where:{id:booking.id},data:{provider:"razorpay",providerOrderId:data.id}});
  return NextResponse.json({keyId:key,orderId:data.id,amount:data.amount,currency:data.currency,bookingId:booking.id});
}