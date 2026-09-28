import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {renderEmailBody,sendEmail} from "@/lib/email";

export async function POST(req:Request){
 try{
  const b=await req.json(); const creatorId=String(b.creatorId||""),email=String(b.email||"").trim().toLowerCase(),automationId=String(b.automationId||"");
  if(!creatorId||!email||!automationId)return NextResponse.json({error:"Trigger data is incomplete."},{status:400});
  const automation=await prisma.emailAutomation.findFirst({where:{id:automationId,creatorId,enabled:true,trigger:"NEW_LEAD"}});
  if(!automation)return NextResponse.json({error:"Automation not found."},{status:404});
  const result=await sendEmail({to:email,subject:automation.subject,html:"<div>"+renderEmailBody(automation.body,String(b.name||"")).replaceAll("\\n","<br/>")+"</div>"});
  return NextResponse.json({success:result.sent});
 }catch{return NextResponse.json({error:"Unable to send automation email."},{status:500});}
}