import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export default async function PurchaseSuccess({searchParams}:{searchParams:Promise<{orderId?:string}>}){
  const {orderId}=await searchParams;
  const order=orderId?await prisma.order.findUnique({where:{id:orderId},include:{product:true}}):null;
  const user=await getCurrentUser();
  const isOwner=Boolean(user&&order&&user.id===order.creatorId);
  return <main style={{maxWidth:760,margin:"auto",padding:"70px 24px",fontFamily:"Arial"}}>
    <a href="/">← Home</a>
    <h1>{order?.status==="PAID"?"Payment successful":"Payment processing"}</h1>
    <p>{order?.status==="PAID"?"Your purchase is confirmed.":"We could not confirm the payment yet. If you just paid, webhook confirmation may take a moment."}</p>
    {order?.status==="PAID"&&order.product.type==="COURSE"&&<p><a href={"/dashboard/learning"}>Go to My Learning →</a></p>}
    {order?.status==="PAID"&&order.product.type==="MEMBERSHIP"&&<p><a href={"/dashboard/memberships"}>Go to My Memberships →</a></p>}
    {order?.status==="PAID"&&order.product.type!=="COURSE"&&<p>Your digital purchase is ready in your order email/download flow.</p>}
    {isOwner&&<p style={{color:"#777"}}>Creator view: this order belongs to your product.</p>}
  </main>;
}