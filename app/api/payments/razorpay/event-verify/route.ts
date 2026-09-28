import {NextResponse} from "next/server";
import crypto from "crypto";
import {prisma} from "@/lib/prisma";
import {sendEmail,renderEmailBody} from "@/lib/email";
export async function POST(req:Request){
 try{
  const b=await req.json(),registrationId=String(b.registrationId||""),paymentId=String(b.razorpay_payment_id||""),orderId=String(b.razorpay_order_id||""),signature=String(b.razorpay_signature||"");
  const reg=await prisma.eventRegistration.findUnique({where:{id:registrationId},include:{event:true}});
  if(!reg)return NextResponse.json({error:"Registration not found."},{status:404});
  if(reg.status==="REGISTERED")return NextResponse.json({success:true,registration:reg});
  if(reg.status!=="PENDING"||reg.providerOrderId!==orderId)return NextResponse.json({error:"Payment order mismatch."},{status:400});
  const key=process.env.RAZORPAY_KEY_ID,secret=process.env.RAZORPAY_KEY_SECRET;if(!key||!secret)return NextResponse.json({error:"Razorpay is not configured."},{status:503});
  const expected=crypto.createHmac("sha256",secret).update(orderId+"|"+paymentId).digest("hex");
  if(signature.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(signature),Buffer.from(expected)))return NextResponse.json({error:"Invalid payment signature."},{status:400});
  const response=await fetch("https://api.razorpay.com/v1/payments/"+encodeURIComponent(paymentId),{headers:{Authorization:"Basic "+Buffer.from(key+":"+secret).toString("base64")}});
  if(!response.ok)return NextResponse.json({error:"Unable to verify payment with provider."},{status:502});
  const payment=await response.json();
  if(payment.order_id!==orderId||Number(payment.amount)!==reg.event.price||String(payment.currency)!==reg.event.currency)return NextResponse.json({error:"Payment amount or currency mismatch."},{status:400});
  if(payment.status&&payment.status!=="captured"&&payment.status!=="authorized")return NextResponse.json({error:"Payment has not been captured."},{status:409});
  const updated=await prisma.eventRegistration.update({where:{id:reg.id},data:{status:"REGISTERED",providerPaymentId:paymentId}});
  if(process.env.RESEND_API_KEY)await sendEmail({to:updated.email,subject:"Event registration confirmed",html:"<p>Your registration for <strong>"+renderEmailBody(reg.event.name)+"</strong> is confirmed.</p><p>"+renderEmailBody(reg.event.startsAt.toLocaleString("en-IN"))+"</p>"+(reg.event.meetingUrl?"<p><a href=""+renderEmailBody(reg.event.meetingUrl)+"">Join event</a></p>":"")});
  return NextResponse.json({success:true,registration:updated});
 }catch{return NextResponse.json({error:"Unable to verify event payment."},{status:500});}
}