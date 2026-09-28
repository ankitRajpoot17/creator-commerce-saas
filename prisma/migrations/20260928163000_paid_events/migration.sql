ALTER TABLE "EventRegistration" ADD COLUMN "provider" TEXT;
ALTER TABLE "EventRegistration" ADD COLUMN "providerOrderId" TEXT;
ALTER TABLE "EventRegistration" ADD COLUMN "providerPaymentId" TEXT;
CREATE INDEX "EventRegistration_providerOrderId_idx" ON "EventRegistration"("providerOrderId");