import {Queue } from "bullmq";

const connection=process.env.REDIS_URL;
export const emailQueue=connection?new Queue("creator-email",{connection}):null;

export async function enqueueEmailJob(data:{to:string;name?:string;subject:string;body:string;creatorId:string;automationId:string;stepId:string;leadId:string}){
 if(!emailQueue) return null;
 return emailQueue.add("send-email",data,{removeOnComplete:100,removeOnFail:500});
}
