import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {getCurrentUser} from "@/lib/auth";
import {revokePaidCourse} from "@/lib/enrollment";
import {deactivateMembershipForOrder} from "@/lib/membership";

export async function POST(req:Request){
 try{
  const u=await getCurrentUser();if(!u)return NextResponse.json({error:"Authentication required."},{status:401});
  const {orderId}=await req.json(),id=String(orderId||"");
  const order=await prisma.order.findUnique({where:{id}});
  if(!order||order.creatorId!==u.id)return NextResponse.json({error:"Order not found."},{status:404});
  if(order.status==="REFUNDED")return NextResponse.json({success:true});
  if(order.status!=="PAID"||!order.providerPaymentId||order.provider!=="razorpay")return NextResponse.json({error:"Only paid Razorpay orders can be refunded."},{status:409});
  const key=process.env.RAZORPAY_KEY_ID,secret=process.env.RAZORPAY_KEY_SECRET;
  if(!key||!secret)return NextResponse.json({error:"Payment provider is not configured."},{status:503});
  const auth=Buffer.from(key+":"+secret).toString("base64");
  const resp=await fetch("https://api.razorpay.com/v1/payments/"+encodeURIComponent(order.providerPaymentId)+"/refund",{method:"POST",headers:{Authorization:"Basic "+auth,"Content-Type":"application/json"},body:JSON.stringify({amount:order.amount})});
  const data=await resp.json();
  if(!resp.ok)return NextResponse.json({error:data?.error?.description||"Refund request failed."},{status:502});
  await prisma.order.update({where:{id},data:{status:"REFUNDED"}});
  await revokePaidCourse(id);
  await deactivateMembershipForOrder(id);
  return NextResponse.json({success:true,refundId:data.id});
 }catch{return NextResponse.json({error:"Unable to process refund."},{status:500});}
}