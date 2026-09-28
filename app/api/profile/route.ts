import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidUsername } from "@/lib/validation";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  const username = new URL(request.url).searchParams.get("username")?.trim().toLowerCase();
  if (!username || !isValidUsername(username)) return NextResponse.json({ error: "Valid username is required." }, { status: 400 });
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
    const displayName = String(body.displayName ?? username).trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    if (!isValidUsername(username) || !displayName || !email) return NextResponse.json({ error: "Username, display name and email are required." }, { status: 400 });
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing?.profile) return NextResponse.json({ error: "An account already exists for this email." }, { status: 409 });
    if (existing) {
      const profile = await prisma.creatorProfile.create({ data: { userId: existing.id, username, displayName } });
      return NextResponse.json({ profile }, { status: 201 });
    }
    const user = await prisma.user.create({ data: { email, name: displayName, profile: { create: { username, displayName } } }, include: { profile: true } });
    return NextResponse.json({ profile: user.profile }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to create profile." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.profile) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const body = await request.json();
    const username = String(body.username ?? "").trim().toLowerCase();
    if (!username || username !== user.profile.username) return NextResponse.json({ error: "You can only update your own profile." }, { status: 403 });
    const profile = await prisma.creatorProfile.update({
      where: { username },
      data: {
        displayName: body.displayName === undefined ? undefined : String(body.displayName).trim(),
        bio: body.bio === undefined ? undefined : String(body.bio).trim() || null,
        avatarUrl: body.avatarUrl === undefined ? undefined : String(body.avatarUrl).trim() || null,
        theme: body.theme === undefined ? undefined : String(body.theme).trim(),
      },
    });
    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json({ error: "Unable to update profile." }, { status: 500 });
  }
}
