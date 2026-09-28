import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";

function authorized(req:Request){
 const secret=process.env.CRON_SECRET;
 return Boolean(secret&&req.headers.get("authorization")==="Bearer "+secret);
}
export async function POST(req:Request){
 if(!authorized(req))return NextResponse.json({error:"Unauthorized."},{status:401});
 const now=new Date();
 const result=await prisma.membership.updateMany({where:{status:"ACTIVE",expiresAt:{not:null,lte:now}},data:{status:"EXPIRED"}});
 return NextResponse.json({expired:result.count,ranAt:now.toISOString()});
}
export async function GET(req:Request){return POST(req);}
