import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(){
 const user=await getCurrentUser(); if(!user) return NextResponse.json({error:"Authentication required."},{status:401});
 const leads=await prisma.lead.findMany({where:{creatorId:user.id},include:{leadMagnet:true},orderBy:{createdAt:"desc"}});
 return NextResponse.json({leads});
}
export async function POST(request:Request){
 try{
  const body=await request.json(); const email=String(body.email??"").trim().toLowerCase(); let creatorId=String(body.creatorId??"").trim();
  if(!creatorId && body.slug) { const magnet=await prisma.leadMagnet.findUnique({where:{slug:String(body.slug).trim()},select:{creatorId:true,id:true,published:true}}); if(!magnet?.published) return NextResponse.json({error:"Lead magnet not found."},{status:404}); creatorId=magnet.creatorId; body.leadMagnetId=magnet.id; }\n  if(!creatorId||!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({error:"Valid email and creator are required."},{status:400});
  const creator=await prisma.user.findUnique({where:{id:creatorId},include:{profile:true}});
  if(!creator?.profile) return NextResponse.json({error:"Creator not found."},{status:404});
  const magnetId=body.leadMagnetId?String(body.leadMagnetId):null;
  if(magnetId){const magnet=await prisma.leadMagnet.findFirst({where:{id:magnetId,creatorId,published:true}});if(!magnet)return NextResponse.json({error:"Lead magnet not found."},{status:404});}
  const lead=await prisma.lead.upsert({where:{creatorId_email:{creatorId,email}},update:{name:String(body.name??"").trim()||undefined,source:String(body.source??"").trim()||undefined,leadMagnetId:magnetId},create:{creatorId,email,name:String(body.name??"").trim()||null,source:String(body.source??"").trim()||null,leadMagnetId:magnetId}});
  return NextResponse.json({lead}, {status:201});
 }catch{return NextResponse.json({error:"Unable to capture lead."},{status:500});}
}