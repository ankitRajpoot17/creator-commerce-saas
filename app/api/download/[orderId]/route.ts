import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSignedDownloadUrl, verifySignedDownload } from "@/lib/storage";

export async function GET(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const url = new URL(request.url);
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { product: true } });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (order.status !== "PAID") return NextResponse.json({ error: "Payment required." }, { status: 403 });
  if (!order.product.fileUrl) return NextResponse.json({ error: "Digital file is not configured." }, { status: 404 });

  const supplied = url.searchParams.get("download_sig");
  if (supplied) {
    const valid = verifySignedDownload(order.id, url.searchParams.get("download_expires") || "", supplied);
    if (!valid) return NextResponse.json({ error: "Download link expired or invalid." }, { status: 403 });
  }

  const signedUrl = createSignedDownloadUrl(order.product.fileUrl, order.id);
  return NextResponse.redirect(signedUrl);
}
