const features = [
  ["Link in Bio", "Build a beautiful creator page and share every important link."],
  ["Digital Products", "Sell PDFs, videos, audio, files and other digital products."],
  ["Courses", "Create structured learning experiences and sell access."],
  ["Communities", "Build paid communities around your audience."],
  ["Bookings", "Offer 1:1 sessions with scheduling and payments."],
  ["Events", "Create webinars and events with registrations and tickets."],
];

export default function Home() {
  return (
    <main>
      <section style={{ padding: "88px 24px 72px", borderBottom: "1px solid #eee" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ fontWeight: 800, letterSpacing: 2, fontSize: 13 }}>CREATOR COMMERCE</div>
          <h1 style={{ fontSize: "clamp(48px, 8vw, 88px)", lineHeight: 0.98, maxWidth: 900, margin: "24px 0" }}>
            Turn your audience into a business.
          </h1>
          <p style={{ fontSize: 21, lineHeight: 1.6, maxWidth: 720, color: "#555" }}>
            One platform for your profile, products, courses, community, bookings, events and creator analytics.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 32 }}>
            <a href="/dashboard" style={{ background: "#111", color: "#fff", padding: "14px 20px", borderRadius: 10, textDecoration: "none", fontWeight: 700 }}>
              Open dashboard
            </a>
            <a href="/u/demo" style={{ border: "1px solid #ddd", padding: "14px 20px", borderRadius: 10, textDecoration: "none", fontWeight: 700 }}>
              View demo profile
            </a>
          </div>
        </div>
      </section>
      <section style={{ padding: "64px 24px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <h2 style={{ fontSize: 38, marginBottom: 32 }}>Everything a creator needs</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
            {features.map(([title, description]) => (
              <article key={title} style={{ border: "1px solid #e8e8e8", borderRadius: 16, padding: 24 }}>
                <h3 style={{ marginTop: 0, fontSize: 21 }}>{title}</h3>
                <p style={{ color: "#666", lineHeight: 1.6 }}>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}