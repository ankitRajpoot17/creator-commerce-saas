CREATE TABLE "EmailUnsubscribe" ("id" TEXT NOT NULL,"creatorId" TEXT NOT NULL,"email" TEXT NOT NULL,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "EmailUnsubscribe_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "EmailUnsubscribe_creatorId_email_key" ON "EmailUnsubscribe"("creatorId","email");
CREATE INDEX "EmailUnsubscribe_email_idx" ON "EmailUnsubscribe"("email");
ALTER TABLE "EmailUnsubscribe" ADD CONSTRAINT "EmailUnsubscribe_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;