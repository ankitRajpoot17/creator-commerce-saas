import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const body = await request.json();
  const module = await prisma.courseModule.findUnique({ where: { id: String(body.moduleId ?? "") }, include: { course: { include: { product: true } } } });
  if (!module || module.course.product.creatorId !== user.id) return NextResponse.json({ error: "Module not found." }, { status: 404 });
  const title = String(body.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "Lesson title is required." }, { status: 400 });
  const type = body.type === "TEXT" || body.type === "FILE" ? body.type : "VIDEO";
  const position = await prisma.lesson.count({ where: { moduleId: module.id } });
  const lesson = await prisma.lesson.create({ data: { moduleId: module.id, title, type, contentUrl: String(body.contentUrl ?? "").trim() || null, body: String(body.body ?? "").trim() || null, position } });
  return NextResponse.json({ lesson }, { status: 201 });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const body = await request.json();
  const lesson = await prisma.lesson.findUnique({ where: { id: String(body.id ?? "") }, include: { module: { include: { course: { include: { product: true } } } } } });
  if (!lesson || lesson.module.course.product.creatorId !== user.id) return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
  const data: { title?: string; type?: "VIDEO"|"TEXT"|"FILE"; contentUrl?: string|null; body?: string|null; position?: number } = {};
  if (body.title !== undefined) {
    const title = String(body.title).trim();
    if (!title) return NextResponse.json({ error: "Lesson title is required." }, { status: 400 });
    data.title = title;
  }
  if (body.type !== undefined) data.type = body.type === "TEXT" || body.type === "FILE" ? body.type : "VIDEO";
  if (body.contentUrl !== undefined) data.contentUrl = String(body.contentUrl).trim() || null;
  if (body.body !== undefined) data.body = String(body.body).trim() || null;
  if (body.position !== undefined && Number.isInteger(Number(body.position))) data.position = Math.max(0, Number(body.position));
  const updated = await prisma.lesson.update({ where: { id: lesson.id }, data });
  return NextResponse.json({ lesson: updated });
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { id } = await request.json();
  const lesson = await prisma.lesson.findUnique({ where: { id: String(id ?? "") }, include: { module: { include: { course: { include: { product: true } } } } } });
  if (!lesson || lesson.module.course.product.creatorId !== user.id) return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
  await prisma.lesson.delete({ where: { id: lesson.id } });
  return NextResponse.json({ success: true });
}