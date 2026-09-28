"use client";
import {useEffect,useState} from "react";
type Lead={id:string;email:string;name:string|null;source:string|null;createdAt:string;leadMagnet?:{name:string}|null};
type Magnet={id:string;name:string;description:string|null;published:boolean;slug:string;fileKey?:string|null;_count:{leads:number}};
export default function Leads(){
 const [leads,setLeads]=useState<Lead[]>([]);const [uploading,setUploading]=useState<string|null>(null);const [magnets,setMagnets]=useState<Magnet[]>([]);const[name,setName]=useState("");const[description,setDescription]=useState("");const[message,setMessage]=useState("");
 async function load(){const[a,b]=await Promise.all([fetch("/api/leads"),fetch("/api/lead-magnets")]);const x=await a.json(),y=await b.json();if(a.ok)setLeads(x.leads||[]);if(b.ok)setMagnets(y.leadMagnets||[]);}
 useEffect(()=>{load()},[]);
 async function upload(m:Magnet,file:File){
 setUploading(m.id);setMessage("");
 try{
  const r=await fetch("/api/lead-magnets/upload-token",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:m.id,filename:file.name,contentType:file.type})});
  const d=await r.json();if(!r.ok)throw new Error(d.error||"Unable to prepare upload.");
  const put=await fetch(d.uploadUrl,{method:"PUT",headers:{"Content-Type":file.type||"application/octet-stream"},body:file});
  if(!put.ok)throw new Error("File upload failed.");
  const saved=await fetch("/api/lead-magnets",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:m.id,fileKey:d.key})});
  const sd=await saved.json();if(!saved.ok)throw new Error(sd.error||"Unable to attach file.");
  setMessage("Private lead magnet uploaded.");load();
 }catch(e){setMessage(e instanceof Error?e.message:"Upload failed.");}finally{setUploading(null);}
}
 async function create(){const r=await fetch("/api/lead-magnets",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,description,published:true})});const d=await r.json();if(!r.ok){setMessage(d.error||"Unable to create.");return}setName("");setDescription("");setMessage("Lead magnet created.");load();}
 return <main style={{maxWidth:1000,margin:"auto",padding:"40px 24px",fontFamily:"Arial"}}><a href="/dashboard">← Dashboard</a><h1>Leads & Lead Magnets</h1><section style={{padding:20,border:"1px solid #ddd",borderRadius:12}}><h2>Create lead magnet</h2><input value={name} onChange={e=>setName(e.target.value)} placeholder="Lead magnet name" style={{padding:10,width:"100%",marginBottom:8}}/><textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Description" style={{padding:10,width:"100%",minHeight:80}}/><button onClick={create} style={{marginTop:10,padding:10}}>Create & publish</button></section>{message&&<p>{message}</p>}<h2 style={{marginTop:30}}>Lead magnets</h2>{magnets.map(m=><article key={m.id} style={{padding:14,border:"1px solid #ddd",borderRadius:10,marginBottom:8}}><strong>{m.name}</strong> — {m._count.leads} leads — {m.published?"Published":"Draft"}<div><a href={"/lead/"+m.slug}>Open form →</a><input type="file" disabled={uploading===m.id} onChange={e=>{const f=e.target.files?.[0];if(f)upload(m,f);e.currentTarget.value="";}} style={{marginLeft:12}}/>{uploading===m.id?" Uploading…":m.fileKey?" Private file attached ✓":""}</div></article>)}<h2 style={{marginTop:30}}>Captured leads ({leads.length})</h2>{leads.map(l=><article key={l.id} style={{padding:12,borderBottom:"1px solid #eee"}}>{l.name||"—"} · {l.email} · {l.leadMagnet?.name||"General"} · {new Date(l.createdAt).toLocaleDateString()}</article>)}</main>