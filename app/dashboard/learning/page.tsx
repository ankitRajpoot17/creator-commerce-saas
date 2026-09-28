import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function LearningDashboard(){
  const user=await getCurrentUser(); if(!user) return <main style={{padding:50}}><h1>Please log in</h1><a href="/login">Log in →</a></main>;
  const enrollments=await prisma.enrollment.findMany({where:{userId:user.id},include:{course:{include:{modules:{include:{lessons:true}}}}},orderBy:{createdAt:"desc"}});
  const progress=await prisma.lessonProgress.findMany({where:{userId:user.id}}); const done=new Set(progress.filter(p=>p.completed).map(p=>p.lessonId));
  return <main style={{maxWidth:1000,margin:"auto",padding:"48px 24px",fontFamily:"Arial"}}><h1>My Learning</h1><p style={{color:"#666"}}>Purchased courses and lesson progress.</p><div style={{display:"grid",gap:16,marginTop:28}}>{enrollments.map(e=>{const lessons=e.course.modules.flatMap(m=>m.lessons);const completed=lessons.filter(l=>done.has(l.id)).length;const percent=lessons.length?Math.round(completed/lessons.length*100):0;return <a key={e.id} href={"/courses/"+e.course.id} style={{border:"1px solid #e5e5e5",borderRadius:14,padding:20,textDecoration:"none"}}><h2 style={{marginTop:0}}>{e.course.title}</h2><p>{completed}/{lessons.length} lessons completed · {percent}%</p><div style={{height:8,background:"#eee",borderRadius:99}}><div style={{height:8,width:percent+"%",background:"#111",borderRadius:99}} /></div></a>})}{!enrollments.length&&<p>No courses yet. Purchase a course to see it here.</p>}</div></main>;
}
