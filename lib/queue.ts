import {Queue} from "bullmq";
import IORedis from "ioredis";

const url=process.env.REDIS_URL;
export const redis=url?new IORedis(url,{maxRetriesPerRequest:null}):null;
export const emailQueue=redis?new Queue("creator-email",{connection:redis}):null;

export async function enqueueEmailJob(data:{to:string;name?:string;subject:string;body:string;creatorId:string;automationId:string;stepId:string;leadId:string},delayHours=0){
 if(!emailQueue)return null;
 return emailQueue.add("send-email",data,{delay:Math.max(0,delayHours)*60*60*1000,removeOnComplete:100,removeOnFail:500});
}
