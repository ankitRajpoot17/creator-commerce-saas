import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  const username = new URL(request.url).searchParams.get("username")?.trim().toLowerCase();
  if (!username) return NextResponse.json({ error: "Username is required." }, { status: 400 });
  const profile = await prisma.creatorProfile.findUnique({ where: { username }, include: { products: { orderBy: { createdAt: "desc" } } } });
  if (!profile) return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  const user = await getCurrentUser();
  if (!user || user.id !== profile.userId) {
    return NextResponse.json({ products: profile.products.filter(p => p.status === "PUBLISHED") });
  }
  return NextResponse.json({ products: profile.products });
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    if (!name) return NextResponse.json({ error: "Product name is required." }, { status: 400 });
    const profile = await prisma.creatorProfile.findUnique({ where: { userId: user.id } });
    if (!profile) return NextResponse.json({ error: "Creator profile not found." }, { status: 404 });
    const price = Number(body.price ?? 0);
    if (!Number.isInteger(price) || price < 0) return NextResponse.json({ error: "Price must be a non-negative integer in paise." }, { status: 400 });
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "product";
    let slug = base, counter = 1;
    while (await prisma.product.findUnique({ where: { slug } })) slug = base + "-" + counter++;
    const product = await prisma.product.create({ data: { creatorId: user.id, profileId: profile.id, name, slug, price, description: String(body.description ?? "").trim() || null, fileUrl: String(body.fileUrl ?? "").trim() || null, coverUrl: String(body.coverUrl ?? "").trim() || null } });
    return NextResponse.json({ product }, { status: 201 });
  } catch { return NextResponse.json({ error: "Unable to create product." }, { status: 500 }); }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const body = await request.json();
    const product = await prisma.product.findUnique({ where: { id: String(body.id ?? "") } });
    if (!product || product.creatorId !== user.id) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    const updated = await prisma.product.update({ where: { id: product.id }, data: { status: body.published ? "PUBLISHED" : "DRAFT" } });
    return NextResponse.json({ product: updated });
  } catch { return NextResponse.json({ error: "Unable to update product." }, { status: 500 }); }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const { id } = await request.json();
    const product = await prisma.product.findUnique({ where: { id: String(id ?? "") } });
    if (!product || product.creatorId !== user.id) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    await prisma.product.delete({ where: { id: product.id } });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: "Unable to delete product." }, { status: 500 }); }
}
