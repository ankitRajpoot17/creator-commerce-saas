import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export async function GET(req:Request){
 const secret=process.env.CRON_SECRET;
 const auth=req.headers.get("authorization");
 if(!secret||auth!=="Bearer "+secret)return NextResponse.json({error:"Unauthorized."},{status:401});
 const now=Date.now(), sent:{reminder24:number;reminder1:number}={reminder24:0,reminder1:0};
 const bookings=await prisma.booking.findMany({where:{status:{in:["PAID","CONFIRMED"]},slot:{startAt:{gte:new Date(now-5*60*1000),lte:new Date(now+25*60*60*1000)}}},include:{slot:true,creator:{include:{profile:true}}}});
 for(const b of bookings){
  const minutes=(b.slot.startAt.getTime()-now)/60000;
  const kind=minutes>=23*60&&minutes<25*60&&!b.reminder24SentAt?"24":minutes>=45&&minutes<75&&!b.reminder1SentAt?"1":null;
  if(!kind)continue;
  const when=b.slot.startAt.toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"});
  const meeting=b.slot.meetingUrl?'<p><a href="'+b.slot.meetingUrl+'">Join meeting</a></p>':"";
  const subject="Session reminder — "+when;
  await sendEmail({to:b.customerEmail,subject,html:"<div><p>Your session with "+(b.creator.profile?.displayName||"the creator")+" is scheduled for "+when+".</p>"+meeting+"</div>"});
  if(b.creator.email)await sendEmail({to:b.creator.email,subject,html:"<div><p>Your session with "+(b.customerName||b.customerEmail)+" is scheduled for "+when+".</p>"+meeting+"</div>"});
  await prisma.booking.update({where:{id:b.id},data:kind==="24"?{reminder24SentAt:new Date()}:{reminder1SentAt:new Date()}});
  sent[kind==="24"?"reminder24":"reminder1"]++;
 }
 return NextResponse.json(sent);
}
