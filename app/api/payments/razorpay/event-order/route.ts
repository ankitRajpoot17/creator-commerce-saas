import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
export async function POST(req:Request){
 try{
  const {registrationId}=await req.json();const id=String(registrationId||"");
  const reg=await prisma.eventRegistration.findUnique({where:{id},include:{event:true}});
  if(!reg||reg.status!=="PENDING")return NextResponse.json({error:"Registration is not payable."},{status:409});
  if(reg.event.startsAt<=new Date())return NextResponse.json({error:"Event has already started."},{status:409});
  if(reg.event.price<=0)return NextResponse.json({free:true,registrationId:reg.id});
  const key=process.env.RAZORPAY_KEY_ID,secret=process.env.RAZORPAY_KEY_SECRET;if(!key||!secret)return NextResponse.json({error:"Razorpay is not configured."},{status:503});
  if(reg.provider==="razorpay"&&reg.providerOrderId)return NextResponse.json({keyId:key,orderId:reg.providerOrderId,amount:reg.event.price,currency:reg.event.currency,registrationId:reg.id});
  const response=await fetch("https://api.razorpay.com/v1/orders",{method:"POST",headers:{Authorization:"Basic "+Buffer.from(key+":"+secret).toString("base64"),"Content-Type":"application/json"},body:JSON.stringify({amount:reg.event.price,currency:reg.event.currency,receipt:"event_"+reg.id})});
  const data=await response.json();if(!response.ok)return NextResponse.json({error:data?.error?.description||"Unable to create payment order."},{status:502});
  await prisma.eventRegistration.update({where:{id:reg.id},data:{provider:"razorpay",providerOrderId:data.id}});
  return NextResponse.json({keyId:key,orderId:data.id,amount:data.amount,currency:data.currency,registrationId:reg.id});
 }catch{return NextResponse.json({error:"Unable to start event payment."},{status:500});}
}