import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";

export async function POST(req:Request){
 try{
  const b=await req.json();const creatorId=String(b.creatorId||""),email=String(b.email||"").trim().toLowerCase();
  if(!creatorId||!email)return NextResponse.json({error:"Creator and email are required."},{status:400});
  await prisma.emailUnsubscribe.upsert({where:{creatorId_email:{creatorId,email}},update:{},create:{creatorId,email}});
  return NextResponse.json({success:true});
 }catch{return NextResponse.json({error:"Unable to unsubscribe."},{status:500});}
}
