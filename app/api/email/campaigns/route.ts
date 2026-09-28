import {NextResponse} from "next/server";
import {getCurrentUser} from "@/lib/auth";
import {prisma} from "@/lib/prisma";
import {renderEmailBody,sendEmail} from "@/lib/email";

const segments=["ALL","LEAD_MAGNET","CUSTOMERS","MEMBERS"];

export async function GET(){
 const user=await getCurrentUser(); if(!user?.profile)return NextResponse.json({error:"Authentication required."},{status:401});
 const campaigns=await prisma.emailCampaign.findMany({where:{creatorId:user.id},orderBy:{createdAt:"desc"}});
 return NextResponse.json({campaigns});
}
export async function POST(req:Request){
 try{
  const user=await getCurrentUser(); if(!user?.profile)return NextResponse.json({error:"Authentication required."},{status:401});
  const b=await req.json(); const name=String(b.name||"").trim(),subject=String(b.subject||"").trim(),body=String(b.body||"").trim(),segment=String(b.segment||"ALL");
  if(!name||!subject||!body||!segments.includes(segment))return NextResponse.json({error:"Name, subject, body and a valid segment are required."},{status:400});
  const campaign=await prisma.emailCampaign.create({data:{creatorId:user.id,name,subject,body,segment}});
  return NextResponse.json({campaign},{status:201});
 }catch{return NextResponse.json({error:"Unable to create campaign."},{status:500});}
}

export async function PATCH(req:Request){
 try{
  const user=await getCurrentUser(); if(!user?.profile)return NextResponse.json({error:"Authentication required."},{status:401});
  const b=await req.json(); const id=String(b.id||""); if(!id)return NextResponse.json({error:"Campaign id is required."},{status:400});
  const campaign=await prisma.emailCampaign.findFirst({where:{id,creatorId:user.id}}); if(!campaign)return NextResponse.json({error:"Campaign not found."},{status:404});
  if(campaign.status==="SENT")return NextResponse.json({error:"Sent campaigns cannot be edited."},{status:409});
  const updated=await prisma.emailCampaign.update({where:{id},data:{name:b.name===undefined?undefined:String(b.name).trim(),subject:b.subject===undefined?undefined:String(b.subject).trim(),body:b.body===undefined?undefined:String(b.body).trim(),segment:b.segment===undefined?undefined:String(b.segment)}});
  return NextResponse.json({campaign:updated});
 }catch{return NextResponse.json({error:"Unable to update campaign."},{status:500});}
}

export async function PUT(req:Request){
 try{
  const user=await getCurrentUser(); if(!user?.profile)return NextResponse.json({error:"Authentication required."},{status:401});
  const b=await req.json(); const id=String(b.id||""); const campaign=await prisma.emailCampaign.findFirst({where:{id,creatorId:user.id}});
  if(!campaign)return NextResponse.json({error:"Campaign not found."},{status:404});
  if(campaign.status==="SENT")return NextResponse.json({error:"Campaign already sent."},{status:409});
  let where:any={creatorId:user.id};
  if(campaign.segment==="LEAD_MAGNET")where.leadMagnetId={not:null};
  if(campaign.segment==="CUSTOMERS")where.creator={orders:{some:{status:"PAID"}}};
  if(campaign.segment==="MEMBERS")where.creator={memberships:{some:{status:"ACTIVE"}}};
  const leads=await prisma.lead.findMany({where,select:{email:true,name:true}});
  let sent=0,failed=0;
  for(const lead of leads){
   try{await sendEmail({to:lead.email,subject:campaign.subject,html:"<div>"+renderEmailBody(campaign.body,lead.name).replaceAll("\\n","<br/>")+"</div>"});sent++;}catch{failed++;}
  }
  const updated=await prisma.emailCampaign.update({where:{id},data:{status:"SENT",sentAt:new Date()}});
  return NextResponse.json({campaign:updated,recipients:leads.length,sent,failed});
 }catch{return NextResponse.json({error:"Unable to send campaign."},{status:500});}
}