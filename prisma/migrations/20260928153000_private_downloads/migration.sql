ALTER TABLE "Order" ADD COLUMN "downloadToken" TEXT;
CREATE UNIQUE INDEX "Order_downloadToken_key" ON "Order"("downloadToken");