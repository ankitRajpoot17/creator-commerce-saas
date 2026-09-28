import { rateLimit, requestKey } from "@/lib/rate-limit";
import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {getCurrentUser} from "@/lib/auth";
import {sendEmail,renderEmailBody} from "@/lib/email";
import crypto from "crypto";
import { emitAutomationEvent } from "@/lib/automation";

export async function POST(req:Request){
 const rl=await rateLimit(requestKey(req,"booking"),10,60); if(!rl.allowed)return NextResponse.json({error:"Too many booking attempts."},{status:429});
 const b=await req.json(); const slotId=String(b.slotId||""),email=String(b.email||"").trim().toLowerCase();
 if(!slotId||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return NextResponse.json({error:"Valid slot and email are required."},{status:400});
 const slot=await prisma.bookingSlot.findUnique({where:{id:slotId}});
 if(!slot||!slot.available||slot.startAt<=new Date())return NextResponse.json({error:"This slot is no longer available."},{status:409});
 const booking=await prisma.$transaction(async tx=>{const locked=await tx.bookingSlot.updateMany({where:{id:slotId,available:true},data:{available:false}});if(!locked.count)throw new Error("SLOT_TAKEN");return tx.booking.create({data:{creatorId:slot.creatorId,slotId,customerEmail:email,customerName:String(b.name||"").trim()||null,note:String(b.note||"").trim()||null,amount:slot.price,currency:slot.currency,manageToken:crypto.randomBytes(32).toString("hex")}})}).catch(e=>{if(e instanceof Error&&e.message==="SLOT_TAKEN")return null;throw e});
 if(!booking)return NextResponse.json({error:"This slot was just booked."},{status:409});
 await emitAutomationEvent({creatorId:slot.creatorId,payload:{event:{type:"BOOKING_CREATED"},booking:{id:booking.id,email:booking.customerEmail,name:booking.customerName,amount:booking.amount,currency:booking.currency,status:booking.status},email:booking.customerEmail,name:booking.customerName||""}}).catch(()=>undefined);
 const creator=await prisma.user.findUnique({where:{id:slot.creatorId},include:{profile:true}});
 if(creator?.email && process.env.RESEND_API_KEY){
  const when=slot.startAt.toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"});
  await sendEmail({to:email,subject:"Booking request received",html:"<div><p>Hi "+renderEmailBody(String(b.name||"there"))+",</p><p>Your session request for "+renderEmailBody(when)+" has been received.</p><p>Booking status: "+(booking.amount>0?"Awaiting payment":"Confirmed")+".</p></div>"});
  if(booking.amount===0) await sendEmail({to:creator.email,subject:"New booking received",html:"<div><p>You have a new booking from "+email+".</p><p>Time: "+when+"</p></div>"});
 }
 return NextResponse.json({booking},{status:201});
}

export async function PATCH(req:Request){
 const user=await getCurrentUser();if(!user)return NextResponse.json({error:"Authentication required."},{status:401});
 const b=await req.json();const id=String(b.id||""),status=String(b.status||"");
 if(!["CANCELLED","CONFIRMED"].includes(status))return NextResponse.json({error:"Invalid booking status."},{status:400});
 const booking=await prisma.booking.findUnique({where:{id},include:{slot:true}});if(!booking||booking.creatorId!==user.id)return NextResponse.json({error:"Booking not found."},{status:404});
 if(booking.status==="PAID"&&status==="CANCELLED")return NextResponse.json({error:"Paid booking cancellation requires a refund workflow."},{status:409});
 const updated=await prisma.$transaction(async tx=>{const next=await tx.booking.update({where:{id},data:{status}});if(status==="CANCELLED")await tx.bookingSlot.update({where:{id:booking.slotId},data:{available:true}});return next;});
 return NextResponse.json({booking:updated});
}

export async function GET(){
 const user=await getCurrentUser();
 if(!user?.profile)return NextResponse.json({error:"Authentication required."},{status:401});
 const bookings=await prisma.booking.findMany({where:{creatorId:user.id},include:{slot:true},orderBy:{slot:{startAt:"asc"}}});
 return NextResponse.json({bookings});
}