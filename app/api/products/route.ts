import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ products: [] });
}

export async function POST(request: Request) {
  const body = await request.json();
  if (!body?.name) return NextResponse.json({ error: "Product name is required." }, { status: 400 });
  return NextResponse.json({ product: body }, { status: 201 });
}
