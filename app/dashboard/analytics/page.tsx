"use client";

import { useEffect, useState } from "react";

type Analytics={summary:{revenue:number;orders:number;pending:number;failed:number;enrollments:number;products:number};daily:{date:string;orders:number;revenue:number}[];byProduct:{id:string;name:string;type:string;orders:number;revenue:number;enrollments:number}[]};

export default function AnalyticsPage(){
 const [data,setData]=useState<Analytics|null>(null); const [days,setDays]=useState(30); const [message,setMessage]=useState("");
 async function load(){
  setMessage("Loading analytics...");
  const r=await fetch("/api/analytics?days="+days); const d=await r.json();
  if(!r.ok){setMessage(d.error||"Unable to load analytics.");return;} setData(d);setMessage("");
 }
 useEffect(()=>{load()},[days]);
 const max=Math.max(...(data?.daily.map(x=>x.revenue)||[1]),1);
 return <main style={{maxWidth:1100,margin:"auto",padding:"40px 24px",fontFamily:"Arial"}}>
  <a href="/dashboard">← Dashboard</a><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}><div><h1>Analytics</h1><p style={{color:"#666"}}>Sales, revenue and course enrollment performance.</p></div><select value={days} onChange={e=>setDays(Number(e.target.value))} style={{padding:10}}><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option></select></div>
  {message&&<p>{message}</p>}
  {data&&<><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,marginTop:25}}>
   <Stat label="Revenue" value={"₹"+(data.summary.revenue/100).toLocaleString("en-IN",{minimumFractionDigits:2})}/><Stat label="Paid orders" value={String(data.summary.orders)}/><Stat label="Enrollments" value={String(data.summary.enrollments)}/><Stat label="Pending" value={String(data.summary.pending)}/><Stat label="Failed" value={String(data.summary.failed)}/><Stat label="Products" value={String(data.summary.products)}/>
  </div>
  <section style={{marginTop:28,padding:20,border:"1px solid #ddd",borderRadius:16}}><h2>Revenue trend</h2><div style={{height:220,display:"flex",alignItems:"end",gap:3,overflow:"hidden"}}>{data.daily.map(d=><div key={d.date} title={d.date+" — ₹"+(d.revenue/100).toFixed(2)} style={{flex:1,minWidth:3,height:Math.max(3,d.revenue/max*190),background:"#111",borderRadius:"3px 3px 0 0"}}/> )}</div></section>
  <section style={{marginTop:28}}><h2>Product performance</h2><div style={{display:"grid",gap:10}}>{data.byProduct.map(p=><article key={p.id} style={{padding:16,border:"1px solid #ddd",borderRadius:12,display:"grid",gridTemplateColumns:"1fr auto auto auto",gap:18,alignItems:"center"}}><strong>{p.name}</strong><span>{p.type}</span><span>{p.orders} sales</span><span>₹{(p.revenue/100).toLocaleString("en-IN",{minimumFractionDigits:2})}</span></article>)}</div></section>
  </>}
 </main>
}
function Stat({label,value}:{label:string;value:string}){return <div style={{padding:18,border:"1px solid #ddd",borderRadius:14}}><div style={{fontSize:13,color:"#777"}}>{label}</div><strong style={{fontSize:24}}>{value}</strong></div>}