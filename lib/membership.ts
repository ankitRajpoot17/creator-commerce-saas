import {prisma} from "@/lib/prisma";
export async function activateMembership(orderId:string){
 const order=await prisma.order.findUnique({where:{id:orderId},include:{product:true}});
 if(!order||order.status!=="PAID"||order.product.type!=="MEMBERSHIP")return null;
 const user=await prisma.user.upsert({where:{email:order.buyerEmail.toLowerCase().trim()},update:{},create:{email:order.buyerEmail.toLowerCase().trim(),role:"CUSTOMER"}});
 return prisma.membership.upsert({where:{productId_memberUserId:{productId:order.productId,memberUserId:user.id}},update:{status:"ACTIVE"},create:{creatorId:order.creatorId,productId:order.productId,memberUserId:user.id,status:"ACTIVE"}});
}
export async function deactivateMembershipForOrder(orderId:string){
 const order=await prisma.order.findUnique({where:{id:orderId},include:{product:true}});
 if(!order||order.product.type!=="MEMBERSHIP")return;
 const user=await prisma.user.findUnique({where:{email:order.buyerEmail.toLowerCase().trim()}});
 if(user)await prisma.membership.updateMany({where:{productId:order.productId,memberUserId:user.id},data:{status:"CANCELLED",expiresAt:new Date()}});
}
