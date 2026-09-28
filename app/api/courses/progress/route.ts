import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const user=await getCurrentUser(); if(!user) return NextResponse.json({error:"Login required."},{status:401});
  const body=await request.json(); const lessonId=String(body.lessonId??""); const value=Number(body.progress??0);
  if(!lessonId || !Number.isFinite(value)) return NextResponse.json({error:"Invalid progress."},{status:400});
  const progress=Math.max(0,Math.min(100,Math.round(value)));
  const lesson=await prisma.lesson.findUnique({where:{id:lessonId},include:{module:{include:{course:true}}}});
  if(!lesson) return NextResponse.json({error:"Lesson not found."},{status:404});
  const enrollment=await prisma.enrollment.findUnique({where:{courseId_userId:{courseId:lesson.module.course.id,userId:user.id}}});
  if(!enrollment) return NextResponse.json({error:"Course enrollment required."},{status:403});
  const record=await prisma.lessonProgress.upsert({where:{lessonId_userId:{lessonId,userId:user.id}},update:{progress,completed:progress>=100},create:{lessonId,userId:user.id,progress,completed:progress>=100}});
  return NextResponse.json({progress:record});
}

export async function GET(request: Request) {
  const user=await getCurrentUser(); if(!user) return NextResponse.json({error:"Login required."},{status:401});
  const courseId=new URL(request.url).searchParams.get("courseId"); if(!courseId) return NextResponse.json({error:"courseId is required."},{status:400});
  const enrollment=await prisma.enrollment.findUnique({where:{courseId_userId:{courseId,userId:user.id}}}); if(!enrollment) return NextResponse.json({error:"Course enrollment required."},{status:403});
  const progress=await prisma.lessonProgress.findMany({where:{userId:user.id,lesson:{module:{courseId}}}});
  return NextResponse.json({progress});
}
