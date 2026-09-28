"use client";

import { useEffect, useState } from "react";

type Order = { id: string; status: string; amount: number; currency: string; product: { id: string; name: string } };

export default function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [id, setId] = useState("");

  useEffect(() => { params.then(p => setId(p.id)); }, [params]);
  useEffect(() => { if (id) fetch("/api/orders/" + id).then(r => r.json()).then(setOrder); }, [id]);

  if (!order) return <main style={{ padding: 64 }}><h1>Loading order...</h1></main>;

  return <main style={{ minHeight: "100vh", padding: "70px 24px", background: "#f7f7f7" }}>
    <section style={{ maxWidth: 650, margin: "auto", background: "#fff", padding: 36, borderRadius: 20 }}>
      <h1>{order.status === "PAID" ? "Payment successful" : "Order status"}</h1>
      <p><strong>{order.product.name}</strong></p>
      <p>Status: {order.status}</p>
      {order.status === "PAID" && <a href={"/api/download/" + order.id} style={{ display: "inline-block", marginTop: 16, padding: "14px 20px", background: "#111", color: "#fff", borderRadius: 10, textDecoration: "none", fontWeight: 700 }}>Download product</a>}
    </section>
  </main>;
}
