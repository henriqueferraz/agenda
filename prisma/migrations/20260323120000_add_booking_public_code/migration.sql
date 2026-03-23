-- AlterTable: codigo publico curto para link de agendamento (/a/[code])
ALTER TABLE "User" ADD COLUMN "booking_public_code" TEXT;

CREATE UNIQUE INDEX "User_booking_public_code_key" ON "User"("booking_public_code");
