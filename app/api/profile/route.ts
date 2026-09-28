import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidUsername } from "@/lib/validation";

export async function GET(request: Request) {
  const username = new URL(request.url).searchParams.get("username")?.trim().toLowerCase();
  if (!username) return NextResponse.json({ error: "Username is required." }, { status: 400 });

  const profile = await prisma.creatorProfile.findUnique({
    where: { username },
    include: { links: { where: { enabled: true }, orderBy: { position: "asc" } } },
  });
  if (!profile) return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  return NextResponse.json({ profile });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = String(body.username ?? "").trim().toLowerCase();
    const displayName = String(body.displayName ?? "").trim();
    const bio = String(body.bio ?? "").trim();

    if (!isValidUsername(username)) return NextResponse.json({ error: "Invalid username." }, { status: 400 });
    if (!displayName) return NextResponse.json({ error: "Display name is required." }, { status: 400 });

    const existing = await prisma.creatorProfile.findUnique({ where: { username } });
    if (existing) return NextResponse.json({ error: "Username is already taken." }, { status: 409 });

    const user = await prisma.user.create({
      data: {
        email: `${username}@placeholder.local`,
        name: displayName,
        profile: { create: { username, displayName, bio, published: true } },
      },
      include: { profile: true },
    });
    return NextResponse.json({ userId: user.id, username: user.profile?.username });
  } catch {
    return NextResponse.json({ error: "Database is not configured or the request failed." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const username = String(body.username ?? "").trim().toLowerCase();
    const displayName = String(body.displayName ?? "").trim();
    const bio = String(body.bio ?? "").trim();
    const theme = String(body.theme ?? "minimal");
    const avatarUrl = String(body.avatarUrl ?? "").trim();

    if (!isValidUsername(username)) return NextResponse.json({ error: "Invalid username." }, { status: 400 });
    if (!displayName) return NextResponse.json({ error: "Display name is required." }, { status: 400 });

    const profile = await prisma.creatorProfile.update({
      where: { username },
      data: { displayName, bio, theme, avatarUrl: avatarUrl || null },
    });
    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json({ error: "Unable to update profile." }, { status: 500 });
  }
}
