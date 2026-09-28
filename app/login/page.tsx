"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function requestOtp() {
    const res = await fetch("/api/auth/request-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    const data = await res.json();
    if (!res.ok) return setMessage(data.error || "Unable to send OTP.");
    setSent(true);
    setMessage(data.devCode ? "Development OTP: " + data.devCode : data.message);
  }

  async function verify() {
    const res = await fetch("/api/auth/verify-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, code }) });
    const data = await res.json();
    if (!res.ok) return setMessage(data.error || "Invalid OTP.");
    router.push("/dashboard");
  }

  return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f5f5f5", padding: 24 }}>
    <section style={{ width: "100%", maxWidth: 420, background: "#fff", padding: 32, borderRadius: 20 }}>
      <h1>Creator login</h1>
      <p>Sign in with a one-time password.</p>
      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" type="email" style={{ width: "100%", padding: 12, marginBottom: 12 }} />
      {!sent ? <button onClick={requestOtp} style={{ padding: 12, width: "100%" }}>Send OTP</button> : <>
        <input value={code} onChange={e => setCode(e.target.value)} placeholder="6-digit OTP" inputMode="numeric" style={{ width: "100%", padding: 12, marginBottom: 12 }} />
        <button onClick={verify} style={{ padding: 12, width: "100%" }}>Verify & continue</button>
      </>}
      {message && <p>{message}</p>}
    </section>
  </main>;
}
