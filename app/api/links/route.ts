import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  const username = new URL(request.url).searchParams.get("username")?.trim().toLowerCase();
  if (!username) return NextResponse.json({ error: "Username is required." }, { status: 400 });
  const profile = await prisma.creatorProfile.findUnique({ where: { username }, include: { links: { orderBy: { position: "asc" } } } });
  if (!profile) return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  const user = await getCurrentUser();
  return NextResponse.json({ links: user?.id === profile.userId ? profile.links : profile.links.filter(l => l.enabled) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const profile = await prisma.creatorProfile.findUnique({ where: { userId: user.id } });
  if (!profile) return NextResponse.json({ error: "Creator profile not found." }, { status: 404 });
  const body = await request.json();
  const title = String(body.title ?? "").trim();
  const url = String(body.url ?? "").trim();
  if (!title || !url) return NextResponse.json({ error: "Title and URL are required." }, { status: 400 });
  const link = await prisma.profileLink.create({ data: { profileId: profile.id, title, url, position: (await prisma.profileLink.count({ where: { profileId: profile.id } })) } });
  return NextResponse.json({ link }, { status: 201 });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const body = await request.json();
  const link = await prisma.profileLink.findUnique({ where: { id: String(body.id ?? "") }, include: { profile: true } });
  if (!link || link.profile.userId !== user.id) return NextResponse.json({ error: "Link not found." }, { status: 404 });
  const updated = await prisma.profileLink.update({ where: { id: link.id }, data: { enabled: Boolean(body.enabled) } });
  return NextResponse.json({ link: updated });
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { id } = await request.json();
  const link = await prisma.profileLink.findUnique({ where: { id: String(id ?? "") }, include: { profile: true } });
  if (!link || link.profile.userId !== user.id) return NextResponse.json({ error: "Link not found." }, { status: 404 });
  await prisma.profileLink.delete({ where: { id: link.id } });
  return NextResponse.json({ success: true });
}
