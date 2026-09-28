import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function esc(v:string){return v.replace(/\\/g,"\\\\").replace(/;/g,"\\;").replace(/,/g,"\\,").replace(/\n/g,"\\n");}
function date(d:Date){return d.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}Z$/,"Z");}

export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 const b=await prisma.booking.findUnique({where:{id},include:{slot:true,creator:{include:{profile:true}}}});
 if(!b)return NextResponse.json({error:"Booking not found."},{status:404});
 if(!["PAID","CONFIRMED"].includes(b.status))return NextResponse.json({error:"Confirmed booking required."},{status:403});
 const name=b.creator.profile?.displayName||"Creator";
 const description="Booking with "+name+(b.slot.meetingUrl?"\nMeeting: "+b.slot.meetingUrl:"");
 const body=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Creator Commerce//EN","BEGIN:VEVENT","UID:"+b.id+"@creator-commerce","DTSTAMP:"+date(new Date()),"DTSTART:"+date(b.slot.startAt),"DTEND:"+date(b.slot.endAt),"SUMMARY:"+esc("1:1 session with "+name),"DESCRIPTION:"+esc(description),"END:VEVENT","END:VCALENDAR"].join("\r\n");
 return new NextResponse(body,{headers:{"Content-Type":"text/calendar; charset=utf-8","Content-Disposition":"attachment; filename=booking.ics"}});
}
