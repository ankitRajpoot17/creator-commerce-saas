import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {getCurrentUser} from "@/lib/auth";

export async function POST(){
 try{
  const u=await getCurrentUser();if(!u)return NextResponse.json({error:"Authentication required."},{status:401});
  const sub=await prisma.subscription.findFirst({where:{userId:u.id,status:{in:["ACTIVE","PENDING"]},provider:"razorpay"}});
  if(!sub)return NextResponse.json({error:"No active Razorpay subscription found."},{status:404});
  if(!sub.providerSubscriptionId)return NextResponse.json({error:"Subscription provider id is missing."},{status:409});
  const key=process.env.RAZORPAY_KEY_ID,secret=process.env.RAZORPAY_KEY_SECRET;
  if(!key||!secret)return NextResponse.json({error:"Razorpay is not configured."},{status:503});
  const response=await fetch("https://api.razorpay.com/v1/subscriptions/"+encodeURIComponent(sub.providerSubscriptionId)+"/cancel",{method:"POST",headers:{Authorization:"Basic "+Buffer.from(key+":"+secret).toString("base64"),"Content-Type":"application/json"},body:JSON.stringify({cancel_at_cycle_end:false})});
  const data=await response.json();
  if(!response.ok)return NextResponse.json({error:data?.error?.description||"Unable to cancel subscription."},{status:502});
  const updated=await prisma.subscription.update({where:{id:sub.id},data:{status:"CANCELLED"}});
  return NextResponse.json({success:true,subscription:updated});
 }catch{return NextResponse.json({error:"Unable to cancel subscription."},{status:500});}
}