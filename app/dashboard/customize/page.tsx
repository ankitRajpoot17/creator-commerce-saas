"use client";

import { useEffect, useState } from "react";

const themes = [
  { id: "minimal", name: "Minimal", background: "#f7f7f7", card: "#ffffff", text: "#111111" },
  { id: "dark", name: "Dark", background: "#111111", card: "#1d1d1d", text: "#ffffff" },
  { id: "soft", name: "Soft", background: "#fff5f5", card: "#ffffff", text: "#4a2525" },
  { id: "ocean", name: "Ocean", background: "#eff8ff", card: "#ffffff", text: "#12304a" },
];

export default function CustomizePage() {
  const [username, setUsername] = useState("demo");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [theme, setTheme] = useState("minimal");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const r = await fetch(`/api/profile?username=${encodeURIComponent(username)}`);
    if (!r.ok) return;
    const data = await r.json();
    setDisplayName(data.profile.displayName || "");
    setBio(data.profile.bio || "");
    setTheme(data.profile.theme || "minimal");
    setAvatarUrl(data.profile.avatarUrl || "");
  }

  useEffect(() => { load(); }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMessage("Saving...");
    const r = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, displayName, bio, theme, avatarUrl }),
    });
    const data = await r.json();
    setMessage(r.ok ? "Saved successfully." : data.error || "Could not save.");
  }

  const selected = themes.find(t => t.id === theme) || themes[0];

  return (
    <main style={{ minHeight: "100vh", padding: "48px 24px" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <a href="/dashboard">← Dashboard</a>
        <h1 style={{ fontSize: 42 }}>Customize Profile</h1>
        <p style={{ color: "#666" }}>Edit your profile identity and choose a theme.</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 36, marginTop: 32 }}>
          <form onSubmit={save} style={{ display: "grid", gap: 18 }}>
            <label>Username<input value={username} onChange={e => setUsername(e.target.value)} style={inputStyle} /></label>
            <label>Display name<input value={displayName} onChange={e => setDisplayName(e.target.value)} style={inputStyle} /></label>
            <label>Avatar URL<input value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://..." style={inputStyle} /></label>
            <label>Bio<textarea value={bio} onChange={e => setBio(e.target.value)} rows={4} style={inputStyle} /></label>

            <div>
              <strong>Theme</strong>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12, marginTop: 10 }}>
                {themes.map(t => (
                  <button type="button" key={t.id} onClick={() => setTheme(t.id)} style={{ textAlign: "left", padding: 16, borderRadius: 14, border: theme === t.id ? "2px solid #111" : "1px solid #ddd", background: t.background, color: t.text }}>
                    <strong>{t.name}</strong>
                    <div style={{ marginTop: 10, height: 24, borderRadius: 7, background: t.card }} />
                  </button>
                ))}
              </div>
            </div>

            <button style={buttonStyle}>Save profile</button>
            {message && <p>{message}</p>}
          </form>

          <div style={{ background: selected.background, color: selected.text, borderRadius: 28, padding: 28, minHeight: 580 }}>
            <div style={{ textAlign: "center" }}>
              {avatarUrl ? <img src={avatarUrl} alt="" style={{ width: 84, height: 84, borderRadius: "50%", objectFit: "cover" }} /> : <div style={{ width: 84, height: 84, borderRadius: "50%", background: "#ddd", margin: "0 auto" }} />}
              <h2>{displayName || "Your Name"}</h2>
              <p style={{ opacity: 0.7 }}>{bio || "Your creator bio will appear here."}</p>
              <div style={{ display: "grid", gap: 10, marginTop: 24 }}>
                <div style={{ background: selected.card, padding: 15, borderRadius: 12 }}>Your first link</div>
                <div style={{ background: selected.card, padding: 15, borderRadius: 12 }}>Your second link</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

const inputStyle = { width: "100%", padding: "12px 14px", marginTop: 6, border: "1px solid #ddd", borderRadius: 10, font: "inherit" };
const buttonStyle = { padding: "13px 18px", border: 0, borderRadius: 10, background: "#111", color: "#fff", fontWeight: 700 };
