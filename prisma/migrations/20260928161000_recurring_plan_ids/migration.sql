ALTER TABLE "SaaSPlan" ADD COLUMN "razorpayMonthlyPlanId" TEXT;
ALTER TABLE "SaaSPlan" ADD COLUMN "razorpayYearlyPlanId" TEXT;
ALTER TABLE "SaaSPlan" DROP COLUMN IF EXISTS "razorpayPlanId";
