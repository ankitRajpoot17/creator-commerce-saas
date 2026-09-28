CREATE TYPE "IntegrationProvider" AS ENUM ('GOOGLE_SHEETS','SLACK','DISCORD','TELEGRAM','WEBHOOK');
CREATE TYPE "IntegrationStatus" AS ENUM ('CONNECTED','ERROR','DISCONNECTED');
CREATE TYPE "AutomationStatus" AS ENUM ('ACTIVE','PAUSED');
CREATE TABLE "IntegrationConnection" (
 "id" TEXT NOT NULL, "creatorId" TEXT NOT NULL, "provider" "IntegrationProvider" NOT NULL,
 "name" TEXT NOT NULL, "status" "IntegrationStatus" NOT NULL DEFAULT 'CONNECTED',
 "credentials" TEXT NOT NULL, "metadata" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "IntegrationConnection_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Automation" (
 "id" TEXT NOT NULL, "creatorId" TEXT NOT NULL, "name" TEXT NOT NULL, "trigger" TEXT NOT NULL,
 "status" "AutomationStatus" NOT NULL DEFAULT 'ACTIVE', "conditions" JSONB,
 "connectionId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "Automation_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AutomationStep" (
 "id" TEXT NOT NULL, "automationId" TEXT NOT NULL, "position" INTEGER NOT NULL DEFAULT 0,
 "action" TEXT NOT NULL, "config" JSONB NOT NULL, "enabled" BOOLEAN NOT NULL DEFAULT true,
 CONSTRAINT "AutomationStep_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "IntegrationDeliveryLog" (
 "id" TEXT NOT NULL, "creatorId" TEXT NOT NULL, "automationId" TEXT, "stepId" TEXT, "provider" TEXT NOT NULL,
 "eventType" TEXT NOT NULL, "status" TEXT NOT NULL, "responseStatus" INTEGER, "error" TEXT,
 "attempts" INTEGER NOT NULL DEFAULT 1, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "IntegrationDeliveryLog_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "IntegrationConnection_creatorId_provider_key" ON "IntegrationConnection"("creatorId","provider");
CREATE INDEX "IntegrationConnection_creatorId_provider_idx" ON "IntegrationConnection"("creatorId","provider");
CREATE INDEX "Automation_creatorId_status_idx" ON "Automation"("creatorId","status");
CREATE INDEX "Automation_creatorId_trigger_status_idx" ON "Automation"("creatorId","trigger","status");
CREATE UNIQUE INDEX "AutomationStep_automationId_position_key" ON "AutomationStep"("automationId","position");
CREATE INDEX "IntegrationDeliveryLog_creatorId_createdAt_idx" ON "IntegrationDeliveryLog"("creatorId","createdAt");
CREATE INDEX "IntegrationDeliveryLog_automationId_createdAt_idx" ON "IntegrationDeliveryLog"("automationId","createdAt");
ALTER TABLE "IntegrationConnection" ADD CONSTRAINT "IntegrationConnection_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Automation" ADD CONSTRAINT "Automation_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Automation" ADD CONSTRAINT "Automation_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "IntegrationConnection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AutomationStep" ADD CONSTRAINT "AutomationStep_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "Automation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IntegrationDeliveryLog" ADD CONSTRAINT "IntegrationDeliveryLog_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IntegrationDeliveryLog" ADD CONSTRAINT "IntegrationDeliveryLog_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "Automation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IntegrationDeliveryLog" ADD CONSTRAINT "IntegrationDeliveryLog_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "AutomationStep"("id") ON DELETE SET NULL ON UPDATE CASCADE;
