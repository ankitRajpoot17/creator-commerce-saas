import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const body = await request.json();
  const product = await prisma.product.findUnique({ where: { id: String(body.productId ?? "") } });
  if (!product || product.creatorId !== user.id || product.type !== "COURSE") return NextResponse.json({ error: "Course product not found." }, { status: 404 });
  const course = await prisma.course.upsert({ where: { productId: product.id }, update: { title: String(body.title ?? product.name), description: String(body.description ?? "") || null }, create: { productId: product.id, title: String(body.title ?? product.name), description: String(body.description ?? "") || null } });
  return NextResponse.json({ course }, { status: 201 });
}

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Course id is required." }, { status: 400 });
  const course = await prisma.course.findUnique({ where: { id }, include: { product: true, modules: { orderBy: { position: "asc" }, include: { lessons: { orderBy: { position: "asc" } } } } } });
  if (!course) return NextResponse.json({ error: "Course not found." }, { status: 404 });
  const user = await getCurrentUser();
  const isOwner = user?.id === course.product.creatorId;
  const enrollment = user ? await prisma.enrollment.findUnique({ where: { courseId_userId: { courseId: course.id, userId: user.id } } }) : null;
  const canViewContent = Boolean(isOwner || enrollment);
  return NextResponse.json({ course: { ...course, modules: course.modules.map(m => ({ ...m, lessons: m.lessons.map(l => canViewContent ? l : { id:l.id,title:l.title,type:l.type,position:l.position,moduleId:l.moduleId }) })) }, access: { isOwner, enrolled:Boolean(enrollment), canViewContent } });
}
