import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const body = await request.json();
  const course = await prisma.course.findUnique({ where: { id: String(body.courseId ?? "") }, include: { product: true } });
  if (!course || course.product.creatorId !== user.id) return NextResponse.json({ error: "Course not found." }, { status: 404 });
  const title = String(body.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "Module title is required." }, { status: 400 });
  const position = await prisma.courseModule.count({ where: { courseId: course.id } });
  const module = await prisma.courseModule.create({ data: { courseId: course.id, title, position } });
  return NextResponse.json({ module }, { status: 201 });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const body = await request.json();
  const module = await prisma.courseModule.findUnique({ where: { id: String(body.id ?? "") }, include: { course: { include: { product: true } } } });
  if (!module || module.course.product.creatorId !== user.id) return NextResponse.json({ error: "Module not found." }, { status: 404 });
  const data: { title?: string; position?: number } = {};
  if (body.title !== undefined) {
    const title = String(body.title).trim();
    if (!title) return NextResponse.json({ error: "Module title is required." }, { status: 400 });
    data.title = title;
  }
  if (body.position !== undefined && Number.isInteger(Number(body.position))) data.position = Math.max(0, Number(body.position));
  const updated = await prisma.courseModule.update({ where: { id: module.id }, data });
  return NextResponse.json({ module: updated });
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { id } = await request.json();
  const module = await prisma.courseModule.findUnique({ where: { id: String(id ?? "") }, include: { course: { include: { product: true } } } });
  if (!module || module.course.product.creatorId !== user.id) return NextResponse.json({ error: "Module not found." }, { status: 404 });
  await prisma.courseModule.delete({ where: { id: module.id } });
  return NextResponse.json({ success: true });
}