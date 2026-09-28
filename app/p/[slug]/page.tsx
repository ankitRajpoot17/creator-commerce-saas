import { prisma } from "@/lib/prisma";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({ where: { slug }, include: { profile: true } });
  if (!product || product.status !== "PUBLISHED") return <main style={{ padding: 64, textAlign: "center" }}><h1>Product not found</h1></main>;
  return <main style={{ minHeight: "100vh", padding: "64px 24px", background: "#f7f7f7" }}><div style={{ maxWidth: 760, margin: "auto", background: "#fff", padding: 40, borderRadius: 24 }}>
    <a href={"/store/" + product.profile.username}>← Store</a>
    {product.coverUrl && <img src={product.coverUrl} alt={product.name} style={{ width: "100%", maxHeight: 360, objectFit: "cover", borderRadius: 16, marginTop: 24 }} />}
    <h1 style={{ fontSize: 44 }}>{product.name}</h1><p style={{ color: "#666", lineHeight: 1.7 }}>{product.description}</p>
    <div style={{ fontSize: 30, fontWeight: 800, margin: "24px 0" }}>₹{(product.price / 100).toFixed(2)}</div>
    <a href={"/checkout/" + product.id} style={{ display: "inline-block", padding: "14px 24px", borderRadius: 10, background: "#111", color: "#fff", fontWeight: 700, textDecoration: "none" }}>Buy now</a>
  </div></main>;
}