import {NextResponse} from "next/server";
import {getCurrentUser} from "@/lib/auth";
import {prisma} from "@/lib/prisma";

export async function POST(req:Request){
 try{
  const user=await getCurrentUser();if(!user?.profile)return NextResponse.json({error:"Authentication required."},{status:401});
  const b=await req.json();const automationId=String(b.automationId||""),subject=String(b.subject||"").trim(),body=String(b.body||"").trim(),delayHours=Math.max(0,Math.floor(Number(b.delayHours||0)));
  const automation=await prisma.emailAutomation.findFirst({where:{id:automationId,creatorId:user.id}});if(!automation)return NextResponse.json({error:"Automation not found."},{status:404});
  if(!subject||!body)return NextResponse.json({error:"Subject and body are required."},{status:400});
  const position=await prisma.emailAutomationStep.count({where:{automationId}});
  const step=await prisma.emailAutomationStep.create({data:{automationId,position,delayHours,subject,body}});
  return NextResponse.json({step},{status:201});
 }catch{return NextResponse.json({error:"Unable to add sequence step."},{status:500});}
}
export async function DELETE(req:Request){
 try{
  const user=await getCurrentUser();if(!user?.profile)return NextResponse.json({error:"Authentication required."},{status:401});
  const id=new URL(req.url).searchParams.get("id")||"";
  const step=await prisma.emailAutomationStep.findFirst({where:{id},include:{automation:true}});
  if(!step||step.automation.creatorId!==user.id)return NextResponse.json({error:"Step not found."},{status:404});
  await prisma.emailAutomationStep.delete({where:{id}});
  return NextResponse.json({success:true});
 }catch{return NextResponse.json({error:"Unable to delete step."},{status:500});}
}
