"use client";

import { useState } from "react";

export default function Checkout({ params }: { params: Promise<{ productId: string }> }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const { productId } = await params;
    setMessage("Creating order...");
    const r = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId, buyerEmail: email }) });
    const data = await r.json();
    setMessage(r.ok ? "Order created. Payment gateway connection is the next step." : data.error || "Checkout failed.");
  }

  return <main style={{ minHeight: "100vh", padding: "70px 24px", background: "#f7f7f7" }}>
    <form onSubmit={submit} style={{ maxWidth: 520, margin: "auto", background: "#fff", padding: 32, borderRadius: 20 }}>
      <a href="javascript:history.back()">← Back</a><h1>Checkout</h1><p>Enter your email to create your order.</p>
      <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={{ width: "100%", padding: 14, border: "1px solid #ddd", borderRadius: 10 }} />
      <button style={{ width: "100%", marginTop: 14, padding: 14, border: 0, borderRadius: 10, background: "#111", color: "#fff", fontWeight: 700 }}>Continue to payment</button>
      {message && <p style={{ color: "#666" }}>{message}</p>}
    </form>
  </main>;
}
