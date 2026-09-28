import {rateLimit,requestKey} from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enqueueEmailJob } from "@/lib/queue";
import { createPrivateDownloadUrl } from "@/lib/storage";
import { emitAutomationEvent } from "@/lib/automation";

export async function GET(){
 const user=await getCurrentUser(); if(!user) return NextResponse.json({error:"Authentication required."},{status:401});
 const leads=await prisma.lead.findMany({where:{creatorId:user.id},include:{leadMagnet:true},orderBy:{createdAt:"desc"}});
 return NextResponse.json({leads});
}
export async function POST(request:Request){
 const rl=await rateLimit(requestKey(request,"lead-capture"),10,60);if(!rl.allowed)return NextResponse.json({error:"Too many lead submissions."},{status:429});
 try{
  const body=await request.json(); const email=String(body.email??"").trim().toLowerCase(); let creatorId=String(body.creatorId??"").trim();
  if(!creatorId && body.slug) { const magnet=await prisma.leadMagnet.findUnique({where:{slug:String(body.slug).trim()},select:{creatorId:true,id:true,published:true}}); if(!magnet?.published) return NextResponse.json({error:"Lead magnet not found."},{status:404}); creatorId=magnet.creatorId; body.leadMagnetId=magnet.id; }\n  if(!creatorId||!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({error:"Valid email and creator are required."},{status:400});
  const creator=await prisma.user.findUnique({where:{id:creatorId},include:{profile:true}});
  if(!creator?.profile) return NextResponse.json({error:"Creator not found."},{status:404});
  const magnetId=body.leadMagnetId?String(body.leadMagnetId):null;
  if(magnetId){const magnet=await prisma.leadMagnet.findFirst({where:{id:magnetId,creatorId,published:true}});if(!magnet)return NextResponse.json({error:"Lead magnet not found."},{status:404});}
  const lead=await prisma.lead.upsert({where:{creatorId_email:{creatorId,email}},update:{name:String(body.name??"").trim()||undefined,source:String(body.source??"").trim()||undefined,leadMagnetId:magnetId},create:{creatorId,email,name:String(body.name??"").trim()||null,source:String(body.source??"").trim()||null,leadMagnetId:magnetId}});
  await emitAutomationEvent({creatorId,payload:{event:{type:"LEAD_CREATED"},lead:{id:lead.id,email:lead.email,name:lead.name,source:lead.source},email:lead.email,name:lead.name||""}}).catch(()=>undefined);\n  const automation=await prisma.emailAutomation.findFirst({where:{creatorId,trigger:"NEW_LEAD",enabled:true}});
  if(automation && process.env.RESEND_API_KEY){
    const steps=await prisma.emailAutomationStep.findMany({where:{automationId:automation.id},orderBy:{position:"asc"}});
    if(steps.length){
      for(const step of steps){
        await enqueueEmailJob({to:email,name:String(body.name??"").trim(),subject:step.subject,body:step.body,creatorId,automationId:automation.id,stepId:step.id,leadId:lead.id},step.delayHours);
      }
    }else{
      await enqueueEmailJob({to:email,name:String(body.name??"").trim(),subject:automation.subject,body:automation.body,creatorId,automationId:automation.id,stepId:"legacy",leadId:lead.id});
    }
  }
  let resourceUrl:null|string=null;
  if(magnetId){const magnet=await prisma.leadMagnet.findUnique({where:{id:magnetId},select:{fileKey:true}});if(magnet?.fileKey){resourceUrl=await createPrivateDownloadUrl(magnet.fileKey);}}
  return NextResponse.json({lead,resourceUrl}, {status:201});
 }catch{return NextResponse.json({error:"Unable to capture lead."},{status:500});}
}