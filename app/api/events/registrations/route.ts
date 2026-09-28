import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {getCurrentUser} from "@/lib/auth";
export async function GET(req:Request){
 const u=await getCurrentUser();if(!u)return NextResponse.json({error:"Authentication required."},{status:401});
 const eventId=new URL(req.url).searchParams.get("eventId");if(!eventId)return NextResponse.json({error:"Event id is required."},{status:400});
 const event=await prisma.event.findUnique({where:{id:eventId},select:{id:true,creatorId:true}});
 if(!event||event.creatorId!==u.id)return NextResponse.json({error:"Event not found."},{status:404});
 return NextResponse.json({registrations:await prisma.eventRegistration.findMany({where:{eventId,status:"REGISTERED"},orderBy:{createdAt:"asc"}})});
}