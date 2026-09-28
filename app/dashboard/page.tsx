const modules = [
  ["Profile & Links", "/onboarding", "Create and configure your public creator page."],
  ["Products", "#", "Digital products and checkout are next."],
  ["Courses", "#", "Course builder is planned for the commerce phase."],
  ["Memberships", "#", "Paid community foundations are planned."],
  ["Lead Magnets", "#", "Capture and manage leads."],
  ["Bookings", "#", "Offer paid 1:1 sessions."],
  ["Events", "#", "Create events and webinars."],
  ["Analytics", "#", "Track visitors, leads and sales."],
];

export default function Dashboard() {
  return (
    <main style={{ minHeight: "100vh", padding: "48px 24px" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <p style={{ fontWeight: 800, letterSpacing: 1 }}>CREATOR COMMERCE</p>
        <h1 style={{ fontSize: 44, marginBottom: 8 }}>Dashboard</h1>
        <p style={{ color: "#666" }}>Build and monetize your creator business.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16, marginTop: 32 }}>
          {modules.map(([title, href, description]) => (
            <a key={title} href={href} style={{ border: "1px solid #e5e5e5", borderRadius: 16, padding: 22, textDecoration: "none" }}>
              <h2 style={{ fontSize: 19, marginTop: 0 }}>{title}</h2>
              <p style={{ color: "#666", lineHeight: 1.5 }}>{description}</p>
              <span style={{ fontSize: 13, color: "#999" }}>Open module →</span>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}