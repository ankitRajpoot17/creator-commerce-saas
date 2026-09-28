import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {getCurrentUser} from "@/lib/auth";

export async function POST(req:Request){
 const b=await req.json(); const slotId=String(b.slotId||""),email=String(b.email||"").trim().toLowerCase();
 if(!slotId||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return NextResponse.json({error:"Valid slot and email are required."},{status:400});
 const slot=await prisma.bookingSlot.findUnique({where:{id:slotId}});
 if(!slot||!slot.available||slot.startAt<=new Date())return NextResponse.json({error:"This slot is no longer available."},{status:409});
 const booking=await prisma.$transaction(async tx=>{const locked=await tx.bookingSlot.updateMany({where:{id:slotId,available:true},data:{available:false}});if(!locked.count)throw new Error("SLOT_TAKEN");return tx.booking.create({data:{creatorId:slot.creatorId,slotId,customerEmail:email,customerName:String(b.name||"").trim()||null,note:String(b.note||"").trim()||null,amount:slot.price,currency:slot.currency}})}).catch(e=>{if(e instanceof Error&&e.message==="SLOT_TAKEN")return null;throw e});
 if(!booking)return NextResponse.json({error:"This slot was just booked."},{status:409}); return NextResponse.json({booking},{status:201});
}

export async function GET(){
 const user=await getCurrentUser();
 if(!user?.profile)return NextResponse.json({error:"Authentication required."},{status:401});
 const bookings=await prisma.booking.findMany({where:{creatorId:user.id},include:{slot:true},orderBy:{slot:{startAt:"asc"}}});
 return NextResponse.json({bookings});
}