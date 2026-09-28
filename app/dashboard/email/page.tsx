"use client";
import {useEffect,useState} from "react";

type Campaign={id:string;name:string;subject:string;body:string;segment:string;status:string;sentAt:string|null};
type Step={id:string;position:number;delayHours:number;subject:string;body:string};
type Automation={id:string;name:string;trigger:string;subject:string;body:string;enabled:boolean;steps:Step[]};

export default function EmailCRM(){
 const[campaigns,setCampaigns]=useState<Campaign[]>([]),[automations,setAutomations]=useState<Automation[]>([]);
 const[name,setName]=useState(""),[subject,setSubject]=useState(""),[body,setBody]=useState(""),[segment,setSegment]=useState("ALL");
 const[autoName,setAutoName]=useState("Welcome sequence"),[autoSubject,setAutoSubject]=useState("Welcome!"),[autoBody,setAutoBody]=useState("Hi {{name}},\n\nThanks for joining my community."),[stepSubject,setStepSubject]=useState(""),[stepBody,setStepBody]=useState(""),[delayHours,setDelayHours]=useState("24"),[msg,setMsg]=useState("");
 async function load(){const[a,b]=await Promise.all([fetch("/api/email/campaigns"),fetch("/api/email/automations")]);const x=await a.json(),y=await b.json();if(a.ok)setCampaigns(x.campaigns||[]);if(b.ok)setAutomations(y.automations||[]);}
 useEffect(()=>{load()},[]);
 async function createCampaign(){const r=await fetch("/api/email/campaigns",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,subject,body,segment})});const d=await r.json();setMsg(r.ok?"Campaign saved.":d.error||"Unable to save.");if(r.ok){setName("");setSubject("");setBody("");load();}}
 async function send(id:string){if(!confirm("Send this campaign to the selected segment?"))return;const r=await fetch("/api/email/campaigns",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});const d=await r.json();setMsg(r.ok?("Sent "+d.sent+" emails; "+d.failed+" failed."):(d.error||"Unable to send."));load();}
 async function createAutomation(){const r=await fetch("/api/email/automations",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:autoName,subject:autoSubject,body:autoBody})});const d=await r.json();setMsg(r.ok?"Automation created with first step.":d.error||"Unable to create.");if(r.ok){setAutoName("");load();}}
 async function addStep(id:string){const r=await fetch("/api/email/automations/steps",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({automationId:id,subject:stepSubject,body:stepBody,delayHours})});const d=await r.json();setMsg(r.ok?"Sequence step added.":d.error||"Unable to add step.");if(r.ok){setStepSubject("");setStepBody("");load();}}
 async function removeStep(id:string){const r=await fetch("/api/email/automations/steps?id="+encodeURIComponent(id),{method:"DELETE"});setMsg(r.ok?"Step removed.":"Unable to remove step.");load();}
 async function toggle(a:Automation){await fetch("/api/email/automations",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:a.id,enabled:!a.enabled})});load();}
 return <main style={{maxWidth:1100,margin:"auto",padding:"40px 24px",fontFamily:"Arial"}}>
  <a href="/dashboard">← Dashboard</a><h1>Email CRM</h1><p>Campaigns, subscriber segments and automated email sequences.</p>{msg&&<p>{msg}</p>}
  <section style={{padding:20,border:"1px solid #ddd",borderRadius:12,marginTop:20}}><h2>New campaign</h2>
   <input value={name} onChange={e=>setName(e.target.value)} placeholder="Campaign name" style={{padding:10,width:"100%",marginBottom:8}}/>
   <input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Email subject" style={{padding:10,width:"100%",marginBottom:8}}/>
   <select value={segment} onChange={e=>setSegment(e.target.value)} style={{padding:10,width:"100%",marginBottom:8}}><option value="ALL">All leads</option><option value="LEAD_MAGNET">Lead magnet subscribers</option><option value="CUSTOMERS">Customers</option><option value="MEMBERS">Members</option></select>
   <textarea value={body} onChange={e=>setBody(e.target.value)} placeholder="Email body. Use {{name}}." style={{padding:10,width:"100%",minHeight:140}}/><button onClick={createCampaign} style={{padding:10,marginTop:10}}>Save campaign</button>
  </section>
  <h2 style={{marginTop:30}}>Campaigns</h2>{campaigns.map(c=><article key={c.id} style={{padding:14,border:"1px solid #ddd",borderRadius:10,marginBottom:8}}><strong>{c.name}</strong> · {c.segment} · {c.status}<p>{c.subject}</p>{c.status!=="SENT"&&<button onClick={()=>send(c.id)}>Send now</button>}</article>)}
  <section style={{padding:20,border:"1px solid #ddd",borderRadius:12,marginTop:30}}><h2>Automation sequence builder</h2><p>Trigger: <strong>New lead</strong>. Use {{name}} for personalization.</p>
   <input value={autoName} onChange={e=>setAutoName(e.target.value)} placeholder="Automation name" style={{padding:10,width:"100%",marginBottom:8}}/>
   <input value={autoSubject} onChange={e=>setAutoSubject(e.target.value)} placeholder="First email subject" style={{padding:10,width:"100%",marginBottom:8}}/>
   <textarea value={autoBody} onChange={e=>setAutoBody(e.target.value)} placeholder="First email body" style={{padding:10,width:"100%",minHeight:100}}/>
   <button onClick={createAutomation} style={{padding:10,marginTop:10}}>Create sequence</button>
  </section>
  {automations.map(a=><article key={a.id} style={{padding:18,border:"1px solid #ddd",borderRadius:12,marginTop:12}}>
   <strong>{a.name}</strong> · {a.enabled?"Enabled":"Disabled"} <button onClick={()=>toggle(a)} style={{marginLeft:10}}>{a.enabled?"Disable":"Enable"}</button>
   <div style={{marginTop:12}}>{a.steps.map((s,i)=><div key={s.id} style={{padding:10,borderTop:"1px solid #eee"}}>Step {i+1} · {i===0?"Immediately":"After "+s.delayHours+"h"} · <strong>{s.subject}</strong> <button onClick={()=>removeStep(s.id)} style={{float:"right"}}>Delete</button></div>)}</div>
   <div style={{marginTop:14}}><input value={stepSubject} onChange={e=>setStepSubject(e.target.value)} placeholder="Next email subject" style={{padding:8,width:"49%",marginRight:"2%"}}/><input value={delayHours} onChange={e=>setDelayHours(e.target.value)} type="number" min="0" placeholder="Delay hours" style={{padding:8,width:"20%"}}/><textarea value={stepBody} onChange={e=>setStepBody(e.target.value)} placeholder="Next email body" style={{padding:8,width:"100%",minHeight:80,marginTop:8}}/><button onClick={()=>addStep(a.id)} style={{padding:8,marginTop:8}}>Add step</button></div>
  </article>)}
 </main>
}