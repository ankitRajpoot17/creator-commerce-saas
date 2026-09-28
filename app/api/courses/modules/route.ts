import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const body = await request.json();
  const course = await prisma.course.findUnique({ where: { id: String(body.courseId ?? "") }, include: { product: true } });
  if (!course || course.product.creatorId !== user.id) return NextResponse.json({ error: "Course not found." }, { status: 404 });
  const position = await prisma.courseModule.count({ where: { courseId: course.id } });
  const module = await prisma.courseModule.create({ data: { courseId: course.id, title: String(body.title ?? "New module"), position } });
  return NextResponse.json({ module }, { status: 201 });
}
