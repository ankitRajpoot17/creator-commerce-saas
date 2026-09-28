import { prisma } from "@/lib/prisma";

export async function enrollPaidCourse(orderId: string) {
  const order = await prisma.order.findUnique({ where:{id:orderId}, include:{product:{include:{course:true}}} });
  if (!order || order.status !== "PAID" || order.product.type !== "COURSE" || !order.product.course) return null;
  const email = order.buyerEmail.toLowerCase().trim();
  const user = await prisma.user.upsert({ where:{email}, update:{}, create:{email,role:"CUSTOMER"} });
  return prisma.enrollment.upsert({ where:{courseId_userId:{courseId:order.product.course.id,userId:user.id}}, update:{}, create:{courseId:order.product.course.id,productId:order.product.id,userId:user.id} });
}
