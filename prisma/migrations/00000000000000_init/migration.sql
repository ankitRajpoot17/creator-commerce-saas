CREATE TYPE "UserRole" AS ENUM ('CREATOR','ADMIN','CUSTOMER');
CREATE TYPE "ProductType" AS ENUM ('DIGITAL','COURSE','MEMBERSHIP');
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT','PUBLISHED','ARCHIVED');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING','PAID','FAILED','REFUNDED');
CREATE TYPE "LessonType" AS ENUM ('VIDEO','TEXT','FILE');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT,
  "image" TEXT,
  "role" "UserRole" NOT NULL DEFAULT 'CREATOR',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "Session" (
  "id" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

CREATE TABLE "LoginCode" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LoginCode_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "LoginCode_userId_code_idx" ON "LoginCode"("userId","code");
CREATE INDEX "LoginCode_expiresAt_idx" ON "LoginCode"("expiresAt");

CREATE TABLE "CreatorProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "username" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "bio" TEXT,
  "avatarUrl" TEXT,
  "theme" TEXT NOT NULL DEFAULT 'minimal',
  "published" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CreatorProfile_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CreatorProfile_userId_key" ON "CreatorProfile"("userId");
CREATE UNIQUE INDEX "CreatorProfile_username_key" ON "CreatorProfile"("username");

CREATE TABLE "ProfileLink" (
  "id" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "position" INTEGER NOT NULL DEFAULT 0,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProfileLink_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Product" (
  "id" TEXT NOT NULL,
  "creatorId" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "type" "ProductType" NOT NULL DEFAULT 'DIGITAL',
  "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "price" INTEGER NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "fileUrl" TEXT,
  "fileKey" TEXT,
  "coverUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
CREATE INDEX "Product_profileId_status_idx" ON "Product"("profileId","status");

CREATE TABLE "Order" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "creatorId" TEXT NOT NULL,
  "buyerEmail" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
  "provider" TEXT,
  "providerId" TEXT,
  "providerPaymentId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Order_buyerEmail_idx" ON "Order"("buyerEmail");
CREATE INDEX "Order_providerId_idx" ON "Order"("providerId");

CREATE TABLE "Course" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Course_productId_key" ON "Course"("productId");

CREATE TABLE "CourseModule" (
  "id" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "position" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CourseModule_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CourseModule_courseId_position_idx" ON "CourseModule"("courseId","position");

CREATE TABLE "Lesson" (
  "id" TEXT NOT NULL,
  "moduleId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "type" "LessonType" NOT NULL DEFAULT 'VIDEO',
  "contentUrl" TEXT,
  "body" TEXT,
  "position" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Lesson_moduleId_position_idx" ON "Lesson"("moduleId","position");

CREATE TABLE "Enrollment" (
  "id" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Enrollment_courseId_userId_key" ON "Enrollment"("courseId","userId");
CREATE INDEX "Enrollment_userId_idx" ON "Enrollment"("userId");

CREATE TABLE "Lead" (
  "id" TEXT NOT NULL,
  "creatorId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT,
  "source" TEXT,
  "leadMagnetId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Lead_creatorId_email_key" ON "Lead"("creatorId","email");
CREATE INDEX "Lead_creatorId_createdAt_idx" ON "Lead"("creatorId","createdAt");

CREATE TABLE "LeadMagnet" (
  "id" TEXT NOT NULL,
  "creatorId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "fileUrl" TEXT,
  "fileKey" TEXT,
  "slug" TEXT NOT NULL,
  "published" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LeadMagnet_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "LeadMagnet_slug_key" ON "LeadMagnet"("slug");
CREATE INDEX "LeadMagnet_creatorId_published_idx" ON "LeadMagnet"("creatorId","published");

CREATE TABLE "BookingSlot" (
  "id" TEXT NOT NULL,
  "creatorId" TEXT NOT NULL,
  "startAt" TIMESTAMP(3) NOT NULL,
  "endAt" TIMESTAMP(3) NOT NULL,
  "price" INTEGER NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "available" BOOLEAN NOT NULL DEFAULT true,
  "meetingUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BookingSlot_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "BookingSlot_creatorId_startAt_idx" ON "BookingSlot"("creatorId","startAt");

CREATE TABLE "Booking" (
  "id" TEXT NOT NULL,
  "creatorId" TEXT NOT NULL,
  "slotId" TEXT NOT NULL,
  "customerEmail" TEXT NOT NULL,
  "customerName" TEXT,
  "note" TEXT,
  "amount" INTEGER NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "provider" TEXT,
  "providerOrderId" TEXT,
  "providerPaymentId" TEXT,
  "reminder24SentAt" TIMESTAMP(3),
  "reminder1SentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Booking_slotId_key" ON "Booking"("slotId");
CREATE INDEX "Booking_creatorId_status_idx" ON "Booking"("creatorId","status");
CREATE INDEX "Booking_customerEmail_idx" ON "Booking"("customerEmail");

CREATE TABLE "Membership" (
  "id" TEXT NOT NULL,
  "creatorId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "memberUserId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3),
  CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Membership_productId_memberUserId_key" ON "Membership"("productId","memberUserId");
CREATE INDEX "Membership_creatorId_status_idx" ON "Membership"("creatorId","status");
CREATE INDEX "Membership_memberUserId_status_idx" ON "Membership"("memberUserId","status");

CREATE TABLE "LessonProgress" (
  "id" TEXT NOT NULL,
  "lessonId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "progress" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LessonProgress_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "LessonProgress_lessonId_userId_key" ON "LessonProgress"("lessonId","userId");
CREATE INDEX "LessonProgress_userId_idx" ON "LessonProgress"("userId");

CREATE TABLE "AnalyticsEvent" (
  "id" TEXT NOT NULL,
  "creatorId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "path" TEXT,
  "referrer" TEXT,
  "sessionId" TEXT,
  "metadata" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AnalyticsEvent_creatorId_createdAt_idx" ON "AnalyticsEvent"("creatorId","createdAt");
CREATE INDEX "AnalyticsEvent_creatorId_type_createdAt_idx" ON "AnalyticsEvent"("creatorId","type","createdAt");
CREATE INDEX "AnalyticsEvent_creatorId_path_createdAt_idx" ON "AnalyticsEvent"("creatorId","path","createdAt");

CREATE TABLE "EmailCampaign" (
  "id" TEXT NOT NULL,
  "creatorId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "segment" TEXT NOT NULL DEFAULT 'ALL',
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmailCampaign_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "EmailCampaign_creatorId_status_idx" ON "EmailCampaign"("creatorId","status");
CREATE INDEX "EmailCampaign_creatorId_createdAt_idx" ON "EmailCampaign"("creatorId","createdAt");

CREATE TABLE "EmailAutomation" (
  "id" TEXT NOT NULL,
  "creatorId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "trigger" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmailAutomation_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "EmailAutomation_creatorId_trigger_enabled_idx" ON "EmailAutomation"("creatorId","trigger","enabled");

CREATE TABLE "EmailAutomationStep" (
  "id" TEXT NOT NULL,
  "automationId" TEXT NOT NULL,
  "position" INTEGER NOT NULL DEFAULT 0,
  "delayHours" INTEGER NOT NULL DEFAULT 0,
  "subject" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmailAutomationStep_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "EmailAutomationStep_automationId_position_idx" ON "EmailAutomationStep"("automationId","position");

CREATE TABLE "EmailDelivery" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT,
  "recipientEmail" TEXT NOT NULL,
  "recipientName" TEXT,
  "subject" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'SENT',
  "providerId" TEXT,
  "automationId" TEXT,
  "stepId" TEXT,
  "error" TEXT,
  "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailDelivery_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "EmailDelivery_campaignId_status_idx" ON "EmailDelivery"("campaignId","status");
CREATE INDEX "EmailDelivery_recipientEmail_sentAt_idx" ON "EmailDelivery"("recipientEmail","sentAt");

ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LoginCode" ADD CONSTRAINT "LoginCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CreatorProfile" ADD CONSTRAINT "CreatorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProfileLink" ADD CONSTRAINT "ProfileLink_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "CreatorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "CreatorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Course" ADD CONSTRAINT "Course_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CourseModule" ADD CONSTRAINT "CourseModule_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "CourseModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_leadMagnetId_fkey" FOREIGN KEY ("leadMagnetId") REFERENCES "LeadMagnet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LeadMagnet" ADD CONSTRAINT "LeadMagnet_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BookingSlot" ADD CONSTRAINT "BookingSlot_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "BookingSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_memberUserId_fkey" FOREIGN KEY ("memberUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LessonProgress" ADD CONSTRAINT "LessonProgress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LessonProgress" ADD CONSTRAINT "LessonProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmailCampaign" ADD CONSTRAINT "EmailCampaign_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmailAutomation" ADD CONSTRAINT "EmailAutomation_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmailAutomationStep" ADD CONSTRAINT "EmailAutomationStep_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "EmailAutomation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmailDelivery" ADD CONSTRAINT "EmailDelivery_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "EmailCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;