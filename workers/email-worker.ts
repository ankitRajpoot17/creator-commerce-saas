import {Worker} from "bullmq";
import {prisma} from "@/lib/prisma";
import {renderEmailBody,sendEmail} from "@/lib/email";
import {redis} from "@/lib/queue";

if(!redis)throw new Error("REDIS_URL is required for the email worker.");

const worker=new Worker("creator-email",async job=>{
 const data=job.data as {to:string;name?:string;subject:string;body:string;creatorId:string;automationId:string;stepId:string;leadId:string};
 const unsubscribed=await prisma.emailUnsubscribe.findUnique({where:{creatorId_email:{creatorId:data.creatorId,email:data.to.toLowerCase().trim()}}});
 if(unsubscribed)return {skipped:"unsubscribed"};
 try{
  const result=await sendEmail({to:data.to,subject:data.subject,html:"<div>"+renderEmailBody(data.body,data.name).replaceAll("\n","<br/>")+"</div>"});
  if(!result.sent)throw new Error(result.reason||"Email provider is not configured.");
  await prisma.emailDelivery.create({data:{recipientEmail:data.to,recipientName:data.name,subject:data.subject,status:"SENT",providerId:(result.data as any)?.id||null,automationId:data.automationId,stepId:data.stepId}});
  return {sent:true};
 }catch(error){
  await prisma.emailDelivery.create({data:{recipientEmail:data.to,recipientName:data.name,subject:data.subject,status:"FAILED",error:error instanceof Error?error.message:"Unknown error",automationId:data.automationId,stepId:data.stepId}});
  throw error;
 }
},{connection:redis});

worker.on("completed",job=>console.log("email job completed",job.id));
worker.on("failed",(job,error)=>console.error("email job failed",job?.id,error.message));
console.log("Creator email worker started.");
