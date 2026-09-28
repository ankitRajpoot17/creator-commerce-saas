import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidUsername } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = String(body.username ?? "").trim().toLowerCase();
    const displayName = String(body.displayName ?? "").trim();
    const bio = String(body.bio ?? "").trim();

    if (!isValidUsername(username)) {
      return NextResponse.json({ error: "Username must be 3-30 characters and contain only letters, numbers, or underscores." }, { status: 400 });
    }
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
