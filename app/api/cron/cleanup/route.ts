import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";

function authorized(req:Request){const secret=process.env.CRON_SECRET;return Boolean(secret&&req.headers.get("authorization")==="Bearer "+secret);}
export async function POST(req:Request){
 if(!authorized(req))return NextResponse.json({error:"Unauthorized."},{status:401});
 const now=new Date(),sessionCutoff=new Date(now.getTime()-1000*60*60*24*31),codeCutoff=new Date(now.getTime()-1000*60*60),orderCutoff=new Date(now.getTime()-1000*60*60*24),bookingCutoff=new Date(now.getTime()-1000*60*60*2);
 const sessions=await prisma.session.deleteMany({where:{OR:[{expiresAt:{lt:now}},{createdAt:{lt:sessionCutoff}}]}});
 const codes=await prisma.loginCode.deleteMany({where:{OR:[{expiresAt:{lt:now}},{createdAt:{lt:codeCutoff}}]}});
 const orders=await prisma.order.updateMany({where:{status:"PENDING",createdAt:{lt:orderCutoff}},data:{status:"FAILED"}});
 const staleBookings=await prisma.booking.findMany({where:{status:"PENDING",createdAt:{lt:bookingCutoff}},select:{id:true,slotId:true}});
 if(staleBookings.length)await prisma.$transaction(async tx=>{await tx.booking.updateMany({where:{id:{in:staleBookings.map(b=>b.id)}},data:{status:"CANCELLED"}});await tx.bookingSlot.updateMany({where:{id:{in:staleBookings.map(b=>b.slotId)}},data:{available:true}});});
 return NextResponse.json({sessions: sessions.count,codes:codes.count,ordersFailed:orders.count,bookingsCancelled:staleBookings.length,ranAt:now.toISOString()});
}
export async function GET(req:Request){return POST(req);}
