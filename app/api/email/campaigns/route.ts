import {NextResponse} from "next/server";
import {getCurrentUser} from "@/lib/auth";
import {prisma} from "@/lib/prisma";
import {renderEmailBody,sendEmail} from "@/lib/email";

const segments=["ALL","LEAD_MAGNET","CUSTOMERS","MEMBERS"];

export async function GET(){
 const user=await getCurrentUser();if(!user?.profile)return NextResponse.json({error:"Authentication required."},{status:401});
 return NextResponse.json({campaigns:await prisma.emailCampaign.findMany({where:{creatorId:user.id},orderBy:{createdAt:"desc"}})});
}
export async function POST(req:Request){
 try{
  const user=await getCurrentUser();if(!user?.profile)return NextResponse.json({error:"Authentication required."},{status:401});
  const b=await req.json();const name=String(b.name||"").trim(),subject=String(b.subject||"").trim(),body=String(b.body||"").trim(),segment=String(b.segment||"ALL");
  if(!name||!subject||!body||!segments.includes(segment))return NextResponse.json({error:"Name, subject, body and a valid segment are required."},{status:400});
  return NextResponse.json({campaign:await prisma.emailCampaign.create({data:{creatorId:user.id,name,subject,body,segment}})},{status:201});
 }catch{return NextResponse.json({error:"Unable to create campaign."},{status:500});}
}
export async function PATCH(req:Request){
 try{
  const user=await getCurrentUser();if(!user?.profile)return NextResponse.json({error:"Authentication required."},{status:401});
  const b=await req.json(),id=String(b.id||"");const current=await prisma.emailCampaign.findFirst({where:{id,creatorId:user.id}});
  if(!current)return NextResponse.json({error:"Campaign not found."},{status:404});
  if(current.status==="SENT")return NextResponse.json({error:"Sent campaigns cannot be edited."},{status:409});
  const updated=await prisma.emailCampaign.update({where:{id},data:{name:b.name===undefined?undefined:String(b.name).trim(),subject:b.subject===undefined?undefined:String(b.subject).trim(),body:b.body===undefined?undefined:String(b.body).trim(),segment:b.segment===undefined?undefined:String(b.segment)}});
  return NextResponse.json({campaign:updated});
 }catch{return NextResponse.json({error:"Unable to update campaign."},{status:500});}
}
export async function PUT(req:Request){
 try{
  const user=await getCurrentUser();if(!user?.profile)return NextResponse.json({error:"Authentication required."},{status:401});
  const b=await req.json(),id=String(b.id||"");const campaign=await prisma.emailCampaign.findFirst({where:{id,creatorId:user.id}});
  if(!campaign)return NextResponse.json({error:"Campaign not found."},{status:404});
  if(campaign.status==="SENT")return NextResponse.json({error:"Campaign already sent."},{status:409});
  let leads=await prisma.lead.findMany({where:{creatorId:user.id,...(campaign.segment==="LEAD_MAGNET"?{leadMagnetId:{not:null}}:{})},select:{email:true,name:true}});
  if(campaign.segment==="CUSTOMERS"){
   const orders=await prisma.order.findMany({where:{creatorId:user.id,status:"PAID"},select:{buyerEmail:true}});
   const emails=new Set(orders.map(o=>o.buyerEmail.toLowerCase().trim()));leads=leads.filter(l=>emails.has(l.email.toLowerCase().trim()));
  }
  if(campaign.segment==="MEMBERS"){
   const memberships=await prisma.membership.findMany({where:{creatorId:user.id,status:"ACTIVE"},select:{memberUserId:true}});
   const ids=memberships.map(m=>m.memberUserId);
   const members=await prisma.user.findMany({where:{id:{in:ids}},select:{email:true}});
   const emails=new Set(members.map(m=>m.email.toLowerCase().trim()));leads=leads.filter(l=>emails.has(l.email.toLowerCase().trim()));
  }
  const unsubscribed=new Set((await prisma.emailUnsubscribe.findMany({where:{creatorId:user.id},select:{email:true}})).map(x=>x.email.toLowerCase().trim()));
  const recipients=leads.filter(l=>!unsubscribed.has(l.email.toLowerCase().trim()));
  let sent=0,failed=0;
  for(const lead of recipients){
   try{
    const result=await sendEmail({to:lead.email,subject:campaign.subject,html:"<div>"+renderEmailBody(campaign.body,lead.name).replaceAll("\n","<br/>")+"</div>"});
    if(!result.sent)throw new Error(result.reason||"Email provider is not configured.");
    sent++;
    await prisma.emailDelivery.create({data:{campaignId:campaign.id,recipientEmail:lead.email,recipientName:lead.name,subject:campaign.subject,status:"SENT",providerId:(result.data as any)?.id||null}});
   }catch(error){
    failed++;
    await prisma.emailDelivery.create({data:{campaignId:campaign.id,recipientEmail:lead.email,recipientName:lead.name,subject:campaign.subject,status:"FAILED",error:error instanceof Error?error.message:"Unknown error"}});
   }
  }
  const status=failed>0&&sent===0?"FAILED":"SENT";
  const updated=await prisma.emailCampaign.update({where:{id},data:{status,sentAt:new Date()}});
  return NextResponse.json({campaign:updated,recipients:recipients.length,sent,failed});
 }catch{return NextResponse.json({error:"Unable to send campaign."},{status:500});}
}
