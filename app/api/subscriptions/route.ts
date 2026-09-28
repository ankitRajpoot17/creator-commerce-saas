import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {getCurrentUser} from "@/lib/auth";

export async function GET(){
 const u=await getCurrentUser();if(!u)return NextResponse.json({error:"Authentication required."},{status:401});
 return NextResponse.json({plans:await prisma.saaSPlan.findMany({where:{active:true}}),subscription:await prisma.subscription.findFirst({where:{userId:u.id,status:"ACTIVE"},include:{plan:true}})});
}

export async function POST(req:Request){
 try{
  const u=await getCurrentUser();if(!u)return NextResponse.json({error:"Authentication required."},{status:401});
  const b=await req.json(),plan=await prisma.saaSPlan.findUnique({where:{id:String(b.planId||"")}});
  if(!plan||!plan.active)return NextResponse.json({error:"Plan not found."},{status:404});
  const provider=String(b.provider||"razorpay").toLowerCase();
  const interval=String(b.interval||"MONTHLY").toUpperCase();
  if(!["MONTHLY","YEARLY"].includes(interval))return NextResponse.json({error:"Invalid billing interval."},{status:400});
  if(provider==="manual") return NextResponse.json({error:"Manual activation is disabled for paid SaaS plans."},{status:400});
  if(provider!=="razorpay")return NextResponse.json({error:"Unsupported billing provider."},{status:400});
  const razorpayPlanId=interval==="YEARLY"?plan.razorpayYearlyPlanId:plan.razorpayMonthlyPlanId;
  if(!razorpayPlanId)return NextResponse.json({error:"This billing interval is not configured for Razorpay recurring billing."},{status:503});
  const key=process.env.RAZORPAY_KEY_ID,secret=process.env.RAZORPAY_KEY_SECRET;
  if(!key||!secret)return NextResponse.json({error:"Razorpay is not configured."},{status:503});
  const existing=await prisma.subscription.findFirst({where:{userId:u.id,status:"ACTIVE",provider:"razorpay",planId:plan.id}});
  if(existing?.providerSubscriptionId)return NextResponse.json({subscription:existing,mode:"existing"});
  const response=await fetch("https://api.razorpay.com/v1/subscriptions",{method:"POST",headers:{Authorization:"Basic "+Buffer.from(key+":"+secret).toString("base64"),"Content-Type":"application/json"},body:JSON.stringify({plan_id:razorpayPlanId,total_count:interval==="YEARLY"?10:120,customer_notify:1,notes:{userId:u.id,planId:plan.id,interval}})});
  const data=await response.json();
  if(!response.ok)return NextResponse.json({error:data?.error?.description||"Unable to create subscription."},{status:502});
  await prisma.subscription.updateMany({where:{userId:u.id,status:"ACTIVE"},data:{status:"CANCELLED"}});
  const sub=await prisma.subscription.upsert({where:{userId_planId:{userId:u.id,planId:plan.id}},update:{status:"PENDING",provider:"razorpay",providerSubscriptionId:data.id,billingInterval:interval},create:{userId:u.id,planId:plan.id,provider:"razorpay",providerSubscriptionId:data.id,billingInterval:interval,status:"PENDING"}});
  return NextResponse.json({subscription:sub,subscriptionId:data.id,keyId:key,mode:"razorpay_subscription"});
 }catch{return NextResponse.json({error:"Unable to start subscription checkout."},{status:500});}
}