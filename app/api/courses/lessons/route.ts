import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const body = await request.json();
  const module = await prisma.courseModule.findUnique({ where: { id: String(body.moduleId ?? "") }, include: { course: { include: { product: true } } } });
  if (!module || module.course.product.creatorId !== user.id) return NextResponse.json({ error: "Module not found." }, { status: 404 });
  const position = await prisma.lesson.count({ where: { moduleId: module.id } });
  const lesson = await prisma.lesson.create({ data: { moduleId: module.id, title: String(body.title ?? "New lesson"), type: body.type === "TEXT" || body.type === "FILE" ? body.type : "VIDEO", contentUrl: String(body.contentUrl ?? "") || null, body: String(body.body ?? "") || null, position } });
  return NextResponse.json({ lesson }, { status: 201 });
}
