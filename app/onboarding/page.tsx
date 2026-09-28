"use client";

import { useState } from "react";

export default function OnboardingPage() {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("Saving...");
    const response = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, displayName, bio }),
    });
    const data = await response.json();
    setMessage(response.ok ? "Profile created. You can now open your public page." : data.error ?? "Something went wrong.");
  }

  return (
    <main style={{ minHeight: "100vh", padding: "56px 24px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <h1 style={{ fontSize: 42 }}>Create your creator profile</h1>
        <p style={{ color: "#666" }}>Set up the foundation for your public link-in-bio page.</p>
        <form onSubmit={submit} style={{ display: "grid", gap: 16, marginTop: 32 }}>
          <label>Username<input value={username} onChange={e => setUsername(e.target.value)} placeholder="ankit" required style={inputStyle} /></label>
          <label>Display name<input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Ankit Kumar" required style={inputStyle} /></label>
          <label>Bio<textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell your audience what you create." rows={4} style={inputStyle} /></label>
          <button style={buttonStyle}>Create profile</button>
        </form>
        {message && <p style={{ marginTop: 20 }}>{message}</p>}
      </div>
    </main>
  );
}

const inputStyle = { width: "100%", padding: "12px 14px", marginTop: 6, border: "1px solid #ddd", borderRadius: 10, font: "inherit" };
const buttonStyle = { padding: "13px 18px", border: 0, borderRadius: 10, background: "#111", color: "#fff", fontWeight: 700, cursor: "pointer" };
