"use client";
import {useEffect,useState} from "react";
export default function EventPage({params}:{params:Promise<{slug:string}>}){
 const[e,setE]=useState<any>(null),[name,setName]=useState(""),[email,setEmail]=useState(""),[msg,setMsg]=useState(""),[busy,setBusy]=useState(false);
 useEffect(()=>{params.then(p=>fetch("/api/events?slug="+encodeURIComponent(p.slug)).then(r=>r.json()).then(d=>setE(d.event)))},[params]);
 async function register(){
  setBusy(true);setMsg("");
  const r=await fetch("/api/events/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({eventId:e.id,name,email})}),d=await r.json();
  if(!r.ok){setMsg(d.error||"Registration failed.");setBusy(false);return}
  if(!d.paymentRequired){setMsg("Registration confirmed.");setBusy(false);return}
  const p=await fetch("/api/payments/razorpay/event-order",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({registrationId:d.registration.id})}).then(x=>x.json());
  if(!p.orderId){setMsg(p.error||"Unable to start payment.");setBusy(false);return}
  const script=document.createElement("script");script.src="https://checkout.razorpay.com/v1/checkout.js";
  script.onload=()=>{const rz=new (window as any).Razorpay({key:p.keyId,amount:p.amount,currency:p.currency,name:"Creator Commerce",description:e.name,order_id:p.orderId,handler:async(resp:any)=>{const v=await fetch("/api/payments/razorpay/event-verify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({registrationId:d.registration.id,...resp})}).then(x=>x.json());setMsg(v.success?"Payment successful. Registration confirmed.":v.error||"Payment verification failed.");setBusy(false)}});rz.on("payment.failed",(x:any)=>{setMsg(x?.error?.description||"Payment failed.");setBusy(false)});rz.open()};script.onerror=()=>{setMsg("Unable to load payment checkout.");setBusy(false)};document.body.appendChild(script);
 }
 if(!e)return <main style={{padding:40}}>Loading event...</main>;
 return <main style={{maxWidth:700,margin:"50px auto",padding:24,fontFamily:"Arial"}}><a href="/">← Home</a><h1>{e.name}</h1><p>{e.description}</p><p>{new Date(e.startsAt).toLocaleString()}</p>{e.price>0&&<p>Price: ₹{e.price/100}</p>}<input value={name} onChange={x=>setName(x.target.value)} placeholder="Your name" style={{padding:12,width:"100%",marginBottom:8}}/><input type="email" value={email} onChange={x=>setEmail(x.target.value)} placeholder="Email" style={{padding:12,width:"100%",marginBottom:8}}/><button disabled={!email||busy} onClick={register}>{e.price>0?"Pay & register":"Register"}</button>{msg&&<p>{msg}</p>}</main>;
}