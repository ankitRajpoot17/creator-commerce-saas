import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const course = await prisma.course.findUnique({ where: { id }, include: { product: true, modules: { orderBy: { position: "asc" }, include: { lessons: { orderBy: { position: "asc" } } } } } });
  if (!course || course.product.status !== "PUBLISHED") return <main style={{padding:50}}><h1>Course not found</h1></main>;
  const user = await getCurrentUser();
  const isOwner = user?.id === course.product.creatorId;
  const enrolled = user ? Boolean(await prisma.enrollment.findUnique({ where: { courseId_userId: { courseId: course.id, userId: user.id } } })) : false;
  const canViewContent = isOwner || enrolled;
  return <main style={{maxWidth:850,margin:"auto",padding:"60px 24px",fontFamily:"Arial"}}>
    <p style={{color:"#666"}}>{enrolled ? "Enrolled" : isOwner ? "Creator preview" : "Course"}</p>
    <h1>{course.title}</h1><p>{course.description}</p>
    {!canViewContent && <div style={{padding:18,border:"1px solid #ddd",borderRadius:12,margin:"24px 0"}}><strong>Purchase required</strong><p>Buy this course and sign in with the same email after payment to access lessons.</p><a href={"/checkout/"+course.product.id}>Go to checkout →</a></div>}
    {course.modules.map(m => <section key={m.id} style={{marginTop:30}}><h2>{m.title}</h2>{m.lessons.map(l => <div key={l.id} style={{padding:"14px 0",borderBottom:"1px solid #eee"}}><strong>{l.title}</strong> <small>({l.type})</small>{canViewContent && l.type==="VIDEO" && l.contentUrl && <video controls src={l.contentUrl} style={{width:"100%",marginTop:10}} />}{canViewContent && l.type==="TEXT" && l.body && <p style={{lineHeight:1.7}}>{l.body}</p>}{canViewContent && l.type==="FILE" && l.contentUrl && <a href={l.contentUrl}>Open lesson file →</a>}</div>)}</section>)}
  </main>;
}
