import IORedis from "ioredis";

type Bucket={count:number;resetAt:number};
const memory=new Map<string,Bucket>();

let redis:IORedis|null=null;
function getRedis(){
 if(redis||!process.env.REDIS_URL)return redis;
 redis=new IORedis(process.env.REDIS_URL,{maxRetriesPerRequest:1});
 return redis;
}

export function requestKey(req:Request,scope:string){
 const forwarded=req.headers.get("x-forwarded-for")||req.headers.get("x-real-ip")||"unknown";
 const ip=forwarded.split(",")[0].trim();
 return scope+":"+ip;
}

export async function rateLimit(key:string,limit:number,windowSeconds:number){
 const r=getRedis();
 if(r){
  const redisKey="rate:"+key;
  const count=await r.incr(redisKey);
  if(count===1)await r.expire(redisKey,windowSeconds);
  const ttl=await r.ttl(redisKey);
  return {allowed:count<=limit,remaining:Math.max(0,limit-count),resetAfter:Math.max(0,ttl)};
 }
 const now=Date.now(),existing=memory.get(key);
 if(!existing||existing.resetAt<=now){
  const next={count:1,resetAt:now+windowSeconds*1000};memory.set(key,next);
  if(memory.size>5000){for(const [k,v] of memory)if(v.resetAt<=now)memory.delete(k);}
  return {allowed:true,remaining:limit-1,resetAfter:windowSeconds};
 }
 existing.count++;
 return {allowed:existing.count<=limit,remaining:Math.max(0,limit-existing.count),resetAfter:Math.ceil((existing.resetAt-now)/1000)};
}

export async function enforceRateLimit(req:Request,scope:string,limit:number,windowSeconds:number){
 return rateLimit(requestKey(req,scope),limit,windowSeconds);
}
