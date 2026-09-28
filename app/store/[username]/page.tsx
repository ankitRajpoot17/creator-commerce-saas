import { prisma } from "@/lib/prisma";

export default async function Store({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const profile = await prisma.creatorProfile.findUnique({
    where: { username: username.toLowerCase() },
    include: { products: { where: { status: "PUBLISHED" }, orderBy: { createdAt: "desc" } } },
  });

  if (!profile) return <main style={{ padding: 64, textAlign: "center" }}><h1>Creator not found</h1></main>;

  return (
    <main style={{ minHeight: "100vh", padding: "56px 24px", background: "#f7f7f7" }}>
      <div style={{ maxWidth: 1000, margin: "auto" }}>
        <a href={"/u/" + profile.username}>← Profile</a>
        <h1 style={{ fontSize: 42, marginBottom: 8 }}>{profile.displayName}'s Store</h1>
        <p style={{ color: "#666" }}>Digital products and resources.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 18, marginTop: 32 }}>
          {profile.products.map((product) => (
            <a key={product.id} href={"/p/" + product.slug} style={{ background: "#fff", borderRadius: 18, padding: 20, textDecoration: "none", border: "1px solid #eee" }}>
              {product.coverUrl && <img src={product.coverUrl} alt={product.name} style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 12 }} />}
              <h2>{product.name}</h2>
              <p style={{ color: "#666" }}>{product.description || "Digital product"}</p>
              <strong>₹{(product.price / 100).toFixed(2)}</strong>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}