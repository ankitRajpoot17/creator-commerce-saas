"use client";
import {useEffect,useState} from "react";

export default function Billing(){
 const[d,setD]=useState<any>(null),[interval,setInterval]=useState<"MONTHLY"|"YEARLY">("MONTHLY"),[busy,setBusy]=useState(false),[msg,setMsg]=useState("");
 useEffect(()=>{fetch("/api/subscriptions").then(r=>r.json()).then(setD)},[]);
 async function choose(plan:any){
  setBusy(true);setMsg("");
  const r=await fetch("/api/subscriptions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({planId:plan.id,provider:"razorpay",interval})});
  const data=await r.json();
  if(!r.ok){setMsg(data.error||"Unable to start subscription.");setBusy(false);return}
  if(data.mode==="existing"){setMsg("You already have this subscription.");setBusy(false);return}
  const script=document.createElement("script");script.src="https://checkout.razorpay.com/v1/checkout.js";
  script.onload=()=>{const rz=new (window as any).Razorpay({key:data.keyId,subscription_id:data.subscriptionId,name:"Creator Commerce",description:plan.name,handler:()=>location.reload()});rz.on("payment.failed",(e:any)=>setMsg(e?.error?.description||"Subscription payment failed."));rz.open();setBusy(false)};
  script.onerror=()=>{setMsg("Unable to load payment checkout.");setBusy(false)};document.body.appendChild(script);
 }
 if(!d)return <main style={{padding:32}}>Loading billing...</main>;
 const current=d.subscription;
 return <main style={{padding:32,maxWidth:900,margin:"auto"}}><h1>SaaS Billing</h1><p>Choose a recurring plan. Payment is processed through Razorpay.</p>
  <div style={{display:"flex",gap:8,margin:"20px 0"}}><button onClick={()=>setInterval("MONTHLY")} disabled={busy}>Monthly</button><button onClick={()=>setInterval("YEARLY")} disabled={busy}>Yearly</button></div>
  {current&&<p>Current plan: <strong>{current.plan.name}</strong> · {current.status}</p>}
  {msg&&<p>{msg}</p>}
  <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>{(d.plans||[]).map((p:any)=><div key={p.id} style={{border:"1px solid #ddd",padding:20,minWidth:220}}><h2>{p.name}</h2><p>₹{interval==="MONTHLY"?p.monthlyPrice:p.yearlyPrice}{interval==="MONTHLY"?"/month":"/year"}</p><button disabled={busy||!p.razorpayPlanId} onClick={()=>choose(p)}>{p.razorpayPlanId?"Choose plan":"Payment setup required"}</button></div>)}</div>
 </main>
}