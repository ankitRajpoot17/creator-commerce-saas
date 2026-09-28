import { prisma } from "@/lib/prisma";
export default async function LeadPage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params; const magnet=await prisma.leadMagnet.findUnique({where:{slug},include:{creator:{include:{profile:true}}}});
 if(!magnet||!magnet.published||!magnet.creator.profile)return <main style={{padding:50}}><h1>Lead magnet not found</h1></main>;
 return <main style={{maxWidth:620,margin:"60px auto",padding:24,fontFamily:"Arial"}}><p>{magnet.creator.profile.displayName}</p><h1>{magnet.name}</h1><p>{magnet.description}</p><form action="/api/leads" method="post" style={{display:"grid",gap:10}}><input type="hidden" name="creatorId" value={magnet.creatorId}/><input type="hidden" name="leadMagnetId" value={magnet.id}/><input name="name" placeholder="Your name" style={{padding:13}}/><input required type="email" name="email" placeholder="you@example.com" style={{padding:13}}/><button style={{padding:13}}>Get it</button></form></main>
}