import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import LessonPlayer from "../LessonPlayer";

export default async function CoursePage({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 const course=await prisma.course.findUnique({where:{id},include:{product:true,modules:{orderBy:{position:"asc"},include:{lessons:{orderBy:{position:"asc"}}}}}});
 if(!course||course.product.status!=="PUBLISHED")return <main style={{padding:50}}><h1>Course not found</h1></main>;
 const user=await getCurrentUser();
 const isOwner=user?.id===course.product.creatorId;
 const enrolled=user?Boolean(await prisma.enrollment.findUnique({where:{courseId_userId:{courseId:course.id,userId:user.id}}})):false;
 const access=isOwner||enrolled;
 const progress=user&&access?await prisma.lessonProgress.findMany({where:{userId:user.id,lesson:{module:{courseId:course.id}}}}):[];
 const initialProgress=Object.fromEntries(progress.map(p=>[p.lessonId,{progress:p.progress,completed:p.completed}]));
 return <main style={{maxWidth:1100,margin:"auto",padding:"50px 24px",fontFamily:"Arial"}}>
  <p style={{color:"#777"}}>{enrolled?"Enrolled":isOwner?"Creator preview":"Course"}</p><h1>{course.title}</h1><p style={{color:"#555"}}>{course.description}</p>
  {!access&&<div style={{padding:18,border:"1px solid #ddd",borderRadius:12,margin:"24px 0"}}><strong>Purchase required</strong><p>Purchase this course and log in with the same email to unlock the lessons.</p><a href={"/checkout/"+course.product.id}>Go to checkout →</a></div>}
  {access?<LessonPlayer modules={course.modules} initialProgress={initialProgress}/>:<div style={{marginTop:30}}>{course.modules.map(m=><section key={m.id}><h2>{m.title}</h2>{m.lessons.map(l=><div key={l.id} style={{padding:"12px 0",borderBottom:"1px solid #eee"}}>{l.title} <small>({l.type})</small></div>)}</section>)}</div>}
 </main>;
}