import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

async function refundRazorpay(paymentId:string,amount:number){
 const key=process.env.RAZORPAY_KEY_ID,secret=process.env.RAZORPAY_KEY_SECRET;
 if(!key||!secret)throw new Error("RAZORPAY_NOT_CONFIGURED");
 const response=await fetch("https://api.razorpay.com/v1/payments/"+encodeURIComponent(paymentId)+"/refund",{method:"POST",headers:{Authorization:"Basic "+Buffer.from(key+":"+secret).toString("base64"),"Content-Type":"application/json"},body:JSON.stringify({amount})});
 if(!response.ok)throw new Error("REFUND_FAILED");
 return response.json();
}

export async function POST(req:Request){
 try{
  const b=await req.json(),id=String(b.bookingId||""),token=String(b.token||"");
  if(!id||!token)return NextResponse.json({error:"Booking id and management token are required."},{status:400});
  const booking=await prisma.booking.findUnique({where:{id},include:{slot:true}});
  if(!booking||!booking.manageToken||token.length!==booking.manageToken.length||!crypto.timingSafeEqual(Buffer.from(token),Buffer.from(booking.manageToken)))return NextResponse.json({error:"Booking not found."},{status:404});
  if(["CANCELLED","REFUNDED"].includes(booking.status))return NextResponse.json({success:true,booking});
  if(booking.slot.startAt<=new Date())return NextResponse.json({error:"This booking can no longer be cancelled."},{status:409});
  let refundId:string|undefined;
  if(booking.status==="PAID"){
   if(booking.provider!=="razorpay"||!booking.providerPaymentId)return NextResponse.json({error:"Paid booking cannot be refunded automatically."},{status:409});
   const refund=await refundRazorpay(booking.providerPaymentId,booking.amount); refundId=refund?.id;
  }
  const updated=await prisma.$transaction(async tx=>{
   const next=await tx.booking.update({where:{id:booking.id},data:{status:booking.status==="PAID"?"REFUNDED":"CANCELLED",providerPaymentId:refundId?booking.providerPaymentId:booking.providerPaymentId}});
   await tx.bookingSlot.update({where:{id:booking.slotId},data:{available:true}});
   return next;
  });
  return NextResponse.json({success:true,booking:updated});
 }catch(e){return NextResponse.json({error:e instanceof Error&&e.message==="RAZORPAY_NOT_CONFIGURED"?"Refund provider is not configured.":"Unable to cancel booking."},{status:500});}
}