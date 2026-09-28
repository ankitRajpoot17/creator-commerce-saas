import { prisma } from "@/lib/prisma";

const themeMap: Record<string, { background: string; card: string; text: string }> = {
  minimal: { background: "#f7f7f7", card: "#ffffff", text: "#111111" },
  dark: { background: "#111111", card: "#1d1d1d", text: "#ffffff" },
  soft: { background: "#fff5f5", card: "#ffffff", text: "#4a2525" },
  ocean: { background: "#eff8ff", card: "#ffffff", text: "#12304a" },
};

export default async function Profile({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const profile = await prisma.creatorProfile.findUnique({
    where: { username },
    include: { links: { where: { enabled: true }, orderBy: { position: "asc" } } },
  });

  if (!profile) return <main style={{ padding: 64, textAlign: "center" }}><h1>Creator not found</h1></main>;

  const theme = themeMap[profile.theme] || themeMap.minimal;

  return (
    <main style={{ minHeight: "100vh", padding: "64px 24px", background: theme.background, color: theme.text }}>
      <div style={{ maxWidth: 620, margin: "0 auto", textAlign: "center" }}>
        {profile.avatarUrl ? <img src={profile.avatarUrl} alt={profile.displayName} style={{ width: 96, height: 96, borderRadius: "50%", objectFit: "cover" }} /> : <div style={{ width: 96, height: 96, borderRadius: "50%", background: "#ddd", margin: "0 auto" }} />}
        <h1>{profile.displayName}</h1>
        <p style={{ opacity: 0.72, lineHeight: 1.6 }}>{profile.bio}</p>
        <div style={{ display: "grid", gap: 12, marginTop: 28 }}>
          {profile.links.map(link => (
            <a key={link.id} href={link.url} target="_blank" rel="noreferrer" style={{ background: theme.card, color: theme.text, borderRadius: 14, padding: 17, textDecoration: "none", fontWeight: 700 }}>
              {link.title}
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
