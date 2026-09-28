ALTER TABLE "Booking" ADD COLUMN "manageToken" TEXT;
CREATE UNIQUE INDEX "Booking_manageToken_key" ON "Booking"("manageToken");