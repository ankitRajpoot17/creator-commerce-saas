"use client";

import { useEffect, useState } from "react";

type LinkItem = { id: string; title: string; url: string; enabled: boolean; position: number };

export default function LinksPage() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [username, setUsername] = useState("demo");
  const [message, setMessage] = useState("");

  async function load() {
    const r = await fetch(`/api/links?username=${encodeURIComponent(username)}`);
    const data = await r.json();
    if (r.ok) setLinks(data.links);
  }

  useEffect(() => { load(); }, []);

  async function addLink(e: React.FormEvent) {
    e.preventDefault();
    setMessage("Adding...");
    const r = await fetch("/api/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, title, url }),
    });
    const data = await r.json();
    setMessage(r.ok ? "Link added." : data.error || "Could not add link.");
    if (r.ok) { setTitle(""); setUrl(""); load(); }
  }

  async function toggle(id: string, enabled: boolean) {
    await fetch("/api/links", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, enabled }),
    });
    load();
  }

  async function remove(id: string) {
    await fetch("/api/links", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    load();
  }

  return (
    <main style={{ minHeight: "100vh", padding: "48px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <a href="/dashboard">← Dashboard</a>
        <h1 style={{ fontSize: 42 }}>Link-in-Bio Builder</h1>
        <p style={{ color: "#666" }}>Manage the links shown on your public creator profile.</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginTop: 32 }}>
          <section>
            <form onSubmit={addLink} style={{ display: "grid", gap: 12, border: "1px solid #eee", borderRadius: 16, padding: 20 }}>
              <h2>Add link</h2>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Link title" required style={inputStyle} />
              <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com" required style={inputStyle} />
              <button style={buttonStyle}>Add link</button>
              {message && <small>{message}</small>}
            </form>

            <div style={{ display: "grid", gap: 10, marginTop: 20 }}>
              {links.map((link, index) => (
                <div key={link.id} style={{ border: "1px solid #eee", borderRadius: 14, padding: 16, display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <strong>{index + 1}. {link.title}</strong>
                    <div style={{ color: "#777", fontSize: 13 }}>{link.url}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => toggle(link.id, !link.enabled)}>{link.enabled ? "Hide" : "Show"}</button>
                    <button onClick={() => remove(link.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div style={{ position: "sticky", top: 24, background: "#f7f7f7", borderRadius: 24, padding: 32, textAlign: "center" }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#ddd", margin: "0 auto 16px" }} />
              <h2>@{username}</h2>
              <p style={{ color: "#666" }}>Live profile preview</p>
              <div style={{ display: "grid", gap: 10, marginTop: 20 }}>
                {links.filter(x => x.enabled).map(link => <div key={link.id} style={{ background: "#fff", borderRadius: 12, padding: 14, fontWeight: 700 }}>{link.title}</div>)}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

const inputStyle = { width: "100%", padding: "12px 14px", border: "1px solid #ddd", borderRadius: 10, font: "inherit" };
const buttonStyle = { padding: "12px 16px", border: 0, borderRadius: 10, background: "#111", color: "#fff", fontWeight: 700 };
