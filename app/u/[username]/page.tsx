export default async function Profile({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;

  return (
    <main style={{ minHeight: "100vh", padding: "72px 24px", background: "#f7f7f7" }}>
      <div style={{ maxWidth: 620, margin: "0 auto", textAlign: "center", background: "#fff", borderRadius: 24, padding: 40 }}>
        <div style={{ width: 92, height: 92, borderRadius: "50%", background: "#eee", margin: "0 auto 20px" }} />
        <h1 style={{ marginBottom: 8 }}>@{username}</h1>
        <p style={{ color: "#666" }}>Creator profile powered by Creator Commerce.</p>
        <div style={{ display: "grid", gap: 12, marginTop: 28 }}>
          {["My website", "My products", "Join my community"].map((label) => (
            <a key={label} href="#" style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16, textDecoration: "none", fontWeight: 700 }}>
              {label}
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}