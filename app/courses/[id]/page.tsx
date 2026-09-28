import { prisma } from "@/lib/prisma";

export default async function CoursePage({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const course=await prisma.course.findUnique({where:{id},include:{product:true,modules:{orderBy:{position:"asc"},include:{lessons:{orderBy:{position:"asc"}}}}}});
  if(!course||course.product.status!=="PUBLISHED") return <main style={{padding:50}}><h1>Course not found</h1></main>;
  return <main style={{maxWidth:850,margin:"auto",padding:"60px 24px",fontFamily:"Arial"}}>
    <h1>{course.title}</h1><p>{course.description}</p>
    {course.modules.map(m=><section key={m.id} style={{marginTop:30}}><h2>{m.title}</h2>{m.lessons.map(l=><div key={l.id} style={{padding:"12px 0",borderBottom:"1px solid #eee"}}>{l.title} <small>({l.type})</small></div>)}</section>)}
  </main>
}
