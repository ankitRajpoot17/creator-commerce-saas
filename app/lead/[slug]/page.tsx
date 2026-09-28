"use client";
import { useState } from "react";

export default function LeadPage({ params }: { params: { slug: string } }) {
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [msg,setMsg]=useState("");
  const [loading,setLoading]=useState(false);
  const [resourceUrl,setResourceUrl]=useState<string|null>(null);
  async function submit(e:React.FormEvent) {
    e.preventDefault(); setLoading(true); setMsg("");
    const r=await fetch("/api/leads",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({slug:params.slug,name,email})});
    const d=await r.json(); setLoading(false); if(r.ok){setMsg("Thanks! Your resource is ready.");setResourceUrl(d.resourceUrl||null);}else setMsg(d.error||"Unable to submit.");
  }
  return <main style={{maxWidth:620,margin:"60px auto",padding:24,fontFamily:"Arial"}}>
    <h1>Get this free resource</h1>
    <p>Enter your details to receive the resource.</p>
    <form onSubmit={submit} style={{display:"grid",gap:10}}>
      <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" style={{padding:13}}/>
      <input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" style={{padding:13}}/>
      <button disabled={loading} style={{padding:13}}>{loading?"Submitting...":"Get it"}</button>
    </form>
    {msg&&<p>{msg}</p>}{resourceUrl&&<p><a href={resourceUrl}>Download your resource →</a></p>}
  </main>;
}
