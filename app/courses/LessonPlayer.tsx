"use client";

import { useMemo, useState } from "react";

type Lesson={id:string;title:string;type:"VIDEO"|"TEXT"|"FILE";contentUrl?:string|null;body?:string|null};
type Module={id:string;title:string;lessons:Lesson[]};

export default function LessonPlayer({modules,initialProgress}:{modules:Module[];initialProgress:Record<string,{progress:number;completed:boolean}>}){
 const lessons=useMemo(()=>modules.flatMap(m=>m.lessons.map(l=>({...l,moduleTitle:m.title}))),[modules]);
 const [active,setActive]=useState(0),[progress,setProgress]=useState(initialProgress);
 const lesson=lessons[active]; if(!lesson)return null;
 async function save(value:number){const p=Math.max(0,Math.min(100,Math.round(value)));setProgress(x=>({...x,[lesson.id]:{progress:p,completed:p>=100}}));await fetch("/api/courses/progress",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({lessonId:lesson.id,progress:p})});}
 return <div style={{display:"grid",gridTemplateColumns:"280px 1fr",gap:24,marginTop:30}}>
  <aside style={{border:"1px solid #e5e5e5",borderRadius:14,padding:12}}>{modules.map(m=><div key={m.id} style={{marginBottom:18}}><strong style={{display:"block",padding:8}}>{m.title}</strong>{m.lessons.map(l=>{const p=progress[l.id]?.progress??0;return <button key={l.id} onClick={()=>setActive(lessons.findIndex(x=>x.id===l.id))} style={{display:"block",width:"100%",textAlign:"left",padding:10,border:0,borderRadius:8,background:l.id===lesson.id?"#f1f1f1":"transparent",cursor:"pointer"}}>{p>=100?"✓ ":""}{l.title}<small style={{display:"block",color:"#777"}}>{p}% complete</small></button>})}</div>)}</aside>
  <section style={{border:"1px solid #e5e5e5",borderRadius:14,padding:24}}><p style={{color:"#777"}}>{lesson.moduleTitle} · Lesson {active+1} of {lessons.length}</p><h2>{lesson.title}</h2>
   {lesson.type==="VIDEO"&&lesson.contentUrl&&<video controls src={lesson.contentUrl} onEnded={()=>save(100)} style={{width:"100%",maxHeight:520,background:"#000"}}/>}
   {lesson.type==="TEXT"&&<div style={{whiteSpace:"pre-wrap",lineHeight:1.8}}>{lesson.body}</div>}
   {lesson.type==="FILE"&&lesson.contentUrl&&<a href={lesson.contentUrl}>Open / download lesson file →</a>}
   <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:24}}><button disabled={active===0} onClick={()=>setActive(x=>x-1)}>← Previous</button><span>{progress[lesson.id]?.progress??0}%</span><button onClick={async()=>{await save(100);if(active<lessons.length-1)setActive(x=>x+1)}}>{active===lessons.length-1?"Complete course":"Complete & Next →"}</button></div>
  </section>
 </div>;
}