import { prisma } from "@/lib/prisma";

export default async function Profile({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const profile = await prisma.creatorProfile.findUnique({
    where: { username },
    include: { links: { where: { enabled: true }, orderBy: { position: "asc" } } },
  });

  if (!profile) {
    return <main style={{ padding: 64, textAlign: "center" }}><h1>Creator not found</h1><p>This profile does not exist yet.</p></main>;
  }

  return (
    <main style={{ minHeight: "100vh", padding: "64px 24px", background: "#f7f7f7" }}>
      <div style={{ maxWidth: 620, margin: "0 auto", textAlign: "center", background: "#fff", borderRadius: 24, padding: 40 }}>
        <div style={{ width: 92, height: 92, borderRadius: "50%", background: "#eee", margin: "0 auto 20px" }} />
        <h1>{profile.displayName}</h1>
        <p style={{ color: "#666", lineHeight: 1.6 }}>{profile.bio}</p>
        <div style={{ display: "grid", gap: 12, marginTop: 28 }}>
          {profile.links.map(link => (
            <a key={link.id} href={link.url} target="_blank" rel="noreferrer" style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16, textDecoration: "none", fontWeight: 700 }}>
              {link.title}
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}