import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidUrl } from "@/lib/validation";

export async function GET(request: Request) {
  const username = new URL(request.url).searchParams.get("username")?.toLowerCase();
  if (!username) return NextResponse.json({ error: "Username is required." }, { status: 400 });

  const profile = await prisma.creatorProfile.findUnique({ where: { username }, include: { links: { orderBy: { position: "asc" } } } });
  if (!profile) return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  return NextResponse.json({ links: profile.links });
}

export async function POST(request: Request) {
  try {
    const { username, title, url } = await request.json();
    if (!username || !title || !isValidUrl(url)) return NextResponse.json({ error: "Valid username, title and URL are required." }, { status: 400 });

    const profile = await prisma.creatorProfile.findUnique({ where: { username: String(username).toLowerCase() }, include: { links: true } });
    if (!profile) return NextResponse.json({ error: "Profile not found." }, { status: 404 });

    const link = await prisma.profileLink.create({
      data: { profileId: profile.id, title: String(title).trim(), url: String(url).trim(), position: profile.links.length },
    });
    return NextResponse.json({ link });
  } catch {
    return NextResponse.json({ error: "Unable to add link." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const { id, enabled } = await request.json();
  if (!id || typeof enabled !== "boolean") return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const link = await prisma.profileLink.update({ where: { id }, data: { enabled } });
  return NextResponse.json({ link });
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "Link id is required." }, { status: 400 });
  await prisma.profileLink.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
