import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPrivateFileKey, createUploadUrl, storageConfigured } from "@/lib/storage";

export async function POST(request: Request) {
 const user=await getCurrentUser();
 if(!user)return NextResponse.json({error:"Authentication required."},{status:401});
 if(!storageConfigured())return NextResponse.json({error:"Private storage is not configured."},{status:503});
 const b=await request.json();const id=String(b.id??"");
 const magnet=await prisma.leadMagnet.findUnique({where:{id}});
 if(!magnet||magnet.creatorId!==user.id)return NextResponse.json({error:"Lead magnet not found."},{status:404});
 const key=createPrivateFileKey(user.id,"lead-"+magnet.id,String(b.filename??"file"));
 const uploadUrl=await createUploadUrl(key,String(b.contentType??"application/octet-stream"));
 return NextResponse.json({uploadUrl,key,expiresIn:900});
}