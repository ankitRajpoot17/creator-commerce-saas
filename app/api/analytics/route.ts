import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request:Request){
  const user=await getCurrentUser();
  if(!user) return NextResponse.json({error:"Authentication required."},{status:401});
  const days=Math.min(90,Math.max(7,Number(new URL(request.url).searchParams.get("days")||30)));
  const since=new Date(Date.now()-days*86400000);
  const [orders,products,enrollments]=await Promise.all([
    prisma.order.findMany({where:{creatorId:user.id,createdAt:{gte:since}},include:{product:true},orderBy:{createdAt:"asc"}}),
    prisma.product.findMany({where:{creatorId:user.id},select:{id:true,name:true,type:true,status:true,price:true}}),
    prisma.enrollment.findMany({where:{product:{creatorId:user.id},createdAt:{gte:since}},include:{product:true}})
  ]);
  const paid=orders.filter(o=>o.status==="PAID");
  const revenue=paid.reduce((sum,o)=>sum+o.amount,0);
  const daily=Array.from({length:days},(_,i)=>{
    const d=new Date(since); d.setDate(d.getDate()+i); const key=d.toISOString().slice(0,10);
    const day=paid.filter(o=>o.createdAt.toISOString().slice(0,10)===key);
    return {date:key,orders:day.length,revenue:day.reduce((s,o)=>s+o.amount,0)};
  });
  const byProduct=products.map(p=>{const po=paid.filter(o=>o.productId===p.id);return {id:p.id,name:p.name,type:p.type,orders:po.length,revenue:po.reduce((s,o)=>s+o.amount,0),enrollments:enrollments.filter(e=>e.productId===p.id).length};}).sort((a,b)=>b.revenue-a.revenue);
  return NextResponse.json({range:{days,since},summary:{revenue,orders:paid.length,pending:orders.filter(o=>o.status==="PENDING").length,failed:orders.filter(o=>o.status==="FAILED").length,enrollments:enrollments.length,products:products.length},daily,byProduct});
}