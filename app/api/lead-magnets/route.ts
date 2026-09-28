import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export async function GET(){
 const user=await getCurrentUser(); if(!user)return NextResponse.json({error:"Authentication required."},{status:401});
 return NextResponse.json({leadMagnets:await prisma.leadMagnet.findMany({where:{creatorId:user.id},include:{_count:{select:{leads:true}}},orderBy:{createdAt:"desc"}})});
}
export async function POST(request:Request){
 const user=await getCurrentUser(); if(!user)return NextResponse.json({error:"Authentication required."},{status:401});
 const b=await request.json(); const name=String(b.name??"").trim(); if(!name)return NextResponse.json({error:"Name is required."},{status:400});
 const base=name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"lead-magnet"; let slug=base,c=1; while(await prisma.leadMagnet.findUnique({where:{slug}}))slug=base+"-"+c++;
 const magnet=await prisma.leadMagnet.create({data:{creatorId:user.id,name,description:String(b.description??"").trim()||null,fileUrl:String(b.fileUrl??"").trim()||null,slug,published:Boolean(b.published)}});
 return NextResponse.json({leadMagnet:magnet},{status:201});
}
export async function PATCH(request:Request){
 const user=await getCurrentUser(); if(!user)return NextResponse.json({error:"Authentication required."},{status:401});
 const b=await request.json(); const item=await prisma.leadMagnet.findUnique({where:{id:String(b.id??"")}});
 if(!item||item.creatorId!==user.id)return NextResponse.json({error:"Lead magnet not found."},{status:404});
 const magnet=await prisma.leadMagnet.update({where:{id:item.id},data:{name:b.name===undefined?undefined:String(b.name).trim(),description:b.description===undefined?undefined:String(b.description).trim()||null,fileUrl:b.fileUrl===undefined?undefined:String(b.fileUrl).trim()||null,published:b.published===undefined?undefined:Boolean(b.published)}});
 return NextResponse.json({leadMagnet:magnet});
}