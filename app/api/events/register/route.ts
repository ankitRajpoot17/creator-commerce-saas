import { rateLimit, requestKey } from "@/lib/rate-limit";
import {NextResponse} from "next/server";import {prisma} from "@/lib/prisma";import {sendEmail,renderEmailBody} from "@/lib/email";
export async function POST(req:Request){
 const rl=await rateLimit(requestKey(req,"event-registration"),10,60);if(!rl.allowed)return NextResponse.json({error:"Too many registration attempts."},{status:429});
 const b=await req.json(),eventId=String(b.eventId||""),email=String(b.email||"").trim().toLowerCase();
 if(!eventId||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return NextResponse.json({error:"Valid event and email are required."},{status:400});
 const e=await prisma.event.findUnique({where:{id:eventId}});if(!e||!e.published)return NextResponse.json({error:"Event not found."},{status:404});
 const existing=await prisma.eventRegistration.findUnique({where:{eventId_email:{eventId,email}}});
 if(existing?.status==="REGISTERED")return NextResponse.json({registration:existing,alreadyRegistered:true});
 if(e.capacity!==null&&!existing){const count=await prisma.eventRegistration.count({where:{eventId,status:"REGISTERED"}});if(count>=e.capacity)return NextResponse.json({error:"Event is full."},{status:409});}
 const status=e.price>0?"PENDING":"REGISTERED";
 const reg=await prisma.eventRegistration.upsert({where:{eventId_email:{eventId,email}},update:{name:String(b.name||"").trim()||null,status},create:{eventId,email,name:String(b.name||"").trim()||null,status}});
 if(e.price===0&&process.env.RESEND_API_KEY)await sendEmail({to:email,subject:"Event registration confirmed",html:"<p>Your registration for <strong>"+renderEmailBody(e.name)+"</strong> is confirmed.</p><p>"+renderEmailBody(e.startsAt.toLocaleString("en-IN"))+"</p>"+(e.meetingUrl?"<p><a href=""+renderEmailBody(e.meetingUrl)+"">Join event</a></p>":"")});
 return NextResponse.json({registration:reg,paymentRequired:e.price>0,amount:e.price,currency:e.currency},{status:201});
}