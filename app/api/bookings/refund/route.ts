import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req:Request){
 try{
  const user=await getCurrentUser();if(!user)return NextResponse.json({error:"Authentication required."},{status:401});
  const {bookingId}=await req.json();const id=String(bookingId||"");
  const booking=await prisma.booking.findUnique({where:{id},include:{slot:true}});
  if(!booking||booking.creatorId!==user.id)return NextResponse.json({error:"Booking not found."},{status:404});
  if(booking.status==="REFUNDED"||booking.status==="CANCELLED")return NextResponse.json({success:true,booking});
  if(booking.status!=="PAID"||booking.provider!=="razorpay"||!booking.providerPaymentId)return NextResponse.json({error:"Only paid Razorpay bookings can be refunded."},{status:409});
  const key=process.env.RAZORPAY_KEY_ID,secret=process.env.RAZORPAY_KEY_SECRET;
  if(!key||!secret)return NextResponse.json({error:"Refund provider is not configured."},{status:503});
  const response=await fetch("https://api.razorpay.com/v1/payments/"+encodeURIComponent(booking.providerPaymentId)+"/refund",{method:"POST",headers:{Authorization:"Basic "+Buffer.from(key+":"+secret).toString("base64"),"Content-Type":"application/json"},body:JSON.stringify({amount:booking.amount})});
  const data=await response.json();
  if(!response.ok)return NextResponse.json({error:data?.error?.description||"Refund failed."},{status:502});
  const updated=await prisma.$transaction(async tx=>{
   const next=await tx.booking.update({where:{id:booking.id},data:{status:"REFUNDED"}});
   await tx.bookingSlot.update({where:{id:booking.slotId},data:{available:true}});
   return next;
  });
  return NextResponse.json({success:true,refundId:data.id,booking:updated});
 }catch{return NextResponse.json({error:"Unable to refund booking."},{status:500});}
}