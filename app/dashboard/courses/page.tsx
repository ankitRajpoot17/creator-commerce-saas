"use client";

import { useEffect, useState } from "react";

type Product={id:string;name:string;type:string};
type Course={id:string;title:string;description:string|null;modules:{id:string;title:string;lessons:{id:string;title:string;type:string}[]}[]};

export default function CoursesDashboard(){
  const [products,setProducts]=useState<Product[]>([]);
  const [course,setCourse]=useState<Course|null>(null);
  const [productId,setProductId]=useState("");
  const [title,setTitle]=useState("");
  const [moduleTitle,setModuleTitle]=useState("");
  const [lessonTitle,setLessonTitle]=useState("");
  const [message,setMessage]=useState("");

  async function load(){
    const session=await fetch("/api/auth/session").then(r=>r.json());
    if(!session.user?.profile) return;
    const data=await fetch("/api/products?username="+encodeURIComponent(session.user.profile.username)).then(r=>r.json());
    const courses=(data.products||[]).filter((p:Product)=>p.type==="COURSE");
    setProducts(courses);
    if(courses[0]) { setProductId(courses[0].id); const c=await fetch("/api/courses?id="+courses[0].id).then(r=>r.json()); if(c.course) setCourse(c.course); }
  }
  useEffect(()=>{load()},[]);

  async function createCourse(){
    const r=await fetch("/api/courses",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({productId,title:title||undefined})});
    const d=await r.json(); if(!r.ok) return setMessage(d.error||"Unable to create course.");
    setCourse(d.course); setMessage("Course saved.");
  }

  async function addModule(){
    if(!course) return;
    const r=await fetch("/api/courses/modules",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({courseId:course.id,title:moduleTitle})});
    const d=await r.json(); if(!r.ok) return setMessage(d.error||"Unable to add module.");
    setModuleTitle(""); setMessage("Module added."); const fresh=await fetch("/api/courses?id="+course.id).then(x=>x.json()); setCourse(fresh.course);
  }

  async function addLesson(moduleId:string){
    const r=await fetch("/api/courses/lessons",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({moduleId,title:lessonTitle,type:"VIDEO"})});
    const d=await r.json(); if(!r.ok) return setMessage(d.error||"Unable to add lesson.");
    setLessonTitle(""); setMessage("Lesson added."); const fresh=await fetch("/api/courses?id="+course?.id).then(x=>x.json()); setCourse(fresh.course);
  }

  return <main style={{maxWidth:1000,margin:"auto",padding:40,fontFamily:"Arial"}}>
    <h1>Course Builder</h1><p>Create modules and lessons for your course products.</p>
    {products.length===0?<p>Create a product with type COURSE first.</p>:<>
      <select value={productId} onChange={async e=>{setProductId(e.target.value);const d=await fetch("/api/courses?id="+e.target.value).then(r=>r.json());setCourse(d.course||null)}} style={{padding:10}}>
        {products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <div style={{marginTop:20}}><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Course title" style={{padding:10,width:300}}/> <button onClick={createCourse}>Create / Save</button></div>
      {course&&<section style={{marginTop:30}}>
        <h2>{course.title}</h2>
        <div><input value={moduleTitle} onChange={e=>setModuleTitle(e.target.value)} placeholder="New module" style={{padding:10}}/> <button onClick={addModule}>Add module</button></div>
        {course.modules.map(m=><article key={m.id} style={{marginTop:20,padding:20,border:"1px solid #ddd",borderRadius:12}}>
          <h3>{m.title}</h3>
          {m.lessons.map(l=><p key={l.id}>• {l.title} ({l.type})</p>)}
          <input value={lessonTitle} onChange={e=>setLessonTitle(e.target.value)} placeholder="New lesson" style={{padding:10}}/> <button onClick={()=>addLesson(m.id)}>Add lesson</button>
        </article>)}
      </section>}
    </>}
    {message&&<p>{message}</p>}
  </main>
}
