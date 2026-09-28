import {NextResponse} from "next/server";
import {getCurrentUser} from "@/lib/auth";
import {prisma} from "@/lib/prisma";
import {encryptSecret} from "@/lib/encryption";

export async function GET(){
 const u=await getCurrentUser();if(!u)return NextResponse.json({error:"Authentication required."},{status:401});
 const connections=await prisma.communityConnection.findMany({where:{creatorId:u.id},select:{id:true,provider:true,externalId:true,enabled:true}});
 return NextResponse.json({connections});
}
export async function POST(req:Request){
 try{
  const u=await getCurrentUser();if(!u)return NextResponse.json({error:"Authentication required."},{status:401});
  const b=await req.json(),provider=String(b.provider||"").trim().toLowerCase(),externalId=String(b.externalId||"").trim(),token=String(b.accessToken||"");
  if(!["telegram","discord"].includes(provider))return NextResponse.json({error:"Unsupported community provider."},{status:400});
  if(!token)return NextResponse.json({error:"Community access token is required."},{status:400});
  const connection=await prisma.communityConnection.upsert({where:{creatorId_provider:{creatorId:u.id,provider}},update:{externalId:externalId||null,accessToken:encryptSecret(token),enabled:true},create:{creatorId:u.id,provider,externalId:externalId||null,accessToken:encryptSecret(token),enabled:true},select:{id:true,provider:true,externalId:true,enabled:true}});
  return NextResponse.json({connection},{status:201});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Unable to save community connection."},{status:500});}
}
