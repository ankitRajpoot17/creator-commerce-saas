import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "product";
}

export async function GET(request: Request) {
  const username = new URL(request.url).searchParams.get("username")?.trim().toLowerCase();
  if (!username) return NextResponse.json({ error: "Username is required." }, { status: 400 });
  const profile = await prisma.creatorProfile.findUnique({
    where: { username },
    include: { products: { orderBy: { createdAt: "desc" } } },
  });
  if (!profile) return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  return NextResponse.json({ products: profile.products });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = String(body.username ?? "").trim().toLowerCase();
    const name = String(body.name ?? "").trim();
    const price = Number(body.price ?? 0);
    if (!username || !name) return NextResponse.json({ error: "Username and product name are required." }, { status: 400 });
    if (!Number.isInteger(price) || price < 0) return NextResponse.json({ error: "Price must be a non-negative integer in paise." }, { status: 400 });
    const profile = await prisma.creatorProfile.findUnique({ where: { username } });
    if (!profile) return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    const base = slugify(name);
    let slug = base;
    let counter = 1;
    while (await prisma.product.findUnique({ where: { slug } })) slug = base + "-" + counter++;
    const product = await prisma.product.create({
      data: {
        creatorId: profile.userId,
        profileId: profile.id,
        name,
        slug,
        price,
        description: String(body.description ?? "").trim() || null,
        fileUrl: String(body.fileUrl ?? "").trim() || null,
        coverUrl: String(body.coverUrl ?? "").trim() || null,
      },
    });
    return NextResponse.json({ product }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to create product." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    if (!body.id) return NextResponse.json({ error: "Product id is required." }, { status: 400 });
    const product = await prisma.product.update({
      where: { id: body.id },
      data: { status: body.published ? "PUBLISHED" : "DRAFT" },
    });
    return NextResponse.json({ product });
  } catch {
    return NextResponse.json({ error: "Unable to update product." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "Product id is required." }, { status: 400 });
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unable to delete product." }, { status: 500 });
  }
}