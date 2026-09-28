import {NextResponse} from "next/server";
import {getCurrentUser} from "@/lib/auth";
import {prisma} from "@/lib/prisma";

export async function GET(){
 const user=await getCurrentUser(); if(!user?.profile)return NextResponse.json({error:"Authentication required."},{status:401});
 return NextResponse.json({automations:await prisma.emailAutomation.findMany({where:{creatorId:user.id},orderBy:{createdAt:"desc"},include:{steps:{orderBy:{position:"asc"}}}})});
}
export async function POST(req:Request){
 try{
  const user=await getCurrentUser(); if(!user?.profile)return NextResponse.json({error:"Authentication required."},{status:401});
  const b=await req.json(); const name=String(b.name||"").trim(),trigger=String(b.trigger||"NEW_LEAD"),subject=String(b.subject||"").trim(),body=String(b.body||"").trim();
  if(!name||!subject||!body||trigger!=="NEW_LEAD")return NextResponse.json({error:"Name, subject, body and a supported trigger are required."},{status:400});
  const automation=await prisma.emailAutomation.create({data:{creatorId:user.id,name,trigger,subject,body,enabled:b.enabled!==false,steps:{create:{position:0,delayHours:0,subject,body}}}});
  return NextResponse.json({automation},{status:201});
 }catch{return NextResponse.json({error:"Unable to create automation."},{status:500});}
}
export async function PATCH(req:Request){
 try{
  const user=await getCurrentUser(); if(!user?.profile)return NextResponse.json({error:"Authentication required."},{status:401});
  const b=await req.json(); const id=String(b.id||""); const current=await prisma.emailAutomation.findFirst({where:{id,creatorId:user.id}});
  if(!current)return NextResponse.json({error:"Automation not found."},{status:404});
  const automation=await prisma.emailAutomation.update({where:{id},data:{enabled:b.enabled===undefined?undefined:Boolean(b.enabled),name:b.name===undefined?undefined:String(b.name).trim(),subject:b.subject===undefined?undefined:String(b.subject).trim(),body:b.body===undefined?undefined:String(b.body).trim()}});
  return NextResponse.json({automation});
 }catch{return NextResponse.json({error:"Unable to update automation."},{status:500});}
}
