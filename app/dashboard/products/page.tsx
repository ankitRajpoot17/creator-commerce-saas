"use client";

import { useEffect, useState } from "react";

type Product={id:string;name:string;type:string;status:string;price:number;currency:string;coverUrl?:string|null};

export default function ProductsPage(){
  const [products,setProducts]=useState<Product[]>([]);
  const [name,setName]=useState("");
  const [type,setType]=useState("DIGITAL");
  const [price,setPrice]=useState("0");
  const [message,setMessage]=useState("");

  async function load(){
    const s=await fetch("/api/auth/session").then(r=>r.json());
    if(!s.user?.profile) return;
    const d=await fetch("/api/products?username="+encodeURIComponent(s.user.profile.username)).then(r=>r.json());
    setProducts(d.products||[]);
  }
  useEffect(()=>{load()},[]);

  async function create(){
    if(!name.trim()) return setMessage("Product name is required.");
    const r=await fetch("/api/products",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,type,price:Math.round(Number(price)*100)})});
    const d=await r.json();
    if(!r.ok) return setMessage(d.error||"Unable to create product.");
    setName(""); setPrice("0"); setMessage("Product created."); await load();
  }

  async function toggle(p:Product){
    const published=p.status!=="PUBLISHED";
    const r=await fetch("/api/products",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:p.id,published})});
    const d=await r.json();
    if(!r.ok) return setMessage(d.error||"Unable to update product.");
    await load();
  }

  return <main style={{maxWidth:1000,margin:"auto",padding:"40px 24px",fontFamily:"Arial"}}>
    <a href="/dashboard">← Dashboard</a>
    <h1>Products</h1>
    <p>Create digital products or course products for your storefront.</p>
    <section style={{padding:20,border:"1px solid #ddd",borderRadius:12,display:"grid",gap:10}}>
      <input value={name} onChange={e=>setName(e.target.value)} placeholder="Product name" style={{padding:10}}/>
      <select value={type} onChange={e=>setType(e.target.value)} style={{padding:10}}>
        <option value="DIGITAL">Digital product</option>
        <option value="COURSE">Course</option>
        <option value="MEMBERSHIP">Membership</option>
      </select>
      <input value={price} onChange={e=>setPrice(e.target.value)} type="number" min="0" step="0.01" placeholder="Price in INR" style={{padding:10}}/>
      <button onClick={create}>Create product</button>
    </section>
    {message&&<p>{message}</p>}
    <section style={{marginTop:25,display:"grid",gap:12}}>
      {products.map(p=><article key={p.id} style={{border:"1px solid #ddd",borderRadius:12,padding:18}}>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <strong style={{flex:1}}>{p.name}</strong><span>{p.type}</span><span>₹{(p.price/100).toFixed(2)}</span><button onClick={()=>toggle(p)}>{p.status==="PUBLISHED"?"Unpublish":"Publish"}</button>
        </div>
        {p.type==="COURSE"&&<div style={{marginTop:10}}><a href="/dashboard/courses">Open Course Builder →</a></div>}
      </article>)}
    </section>
  </main>
}