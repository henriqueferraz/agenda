-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN "managementToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_managementToken_key" ON "Appointment"("managementToken");

-- CreateIndex
CREATE INDEX "Appointment_managementToken_idx" ON "Appointment"("managementToken");
