/*
  Warnings:

  - You are about to drop the column `times` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "times",
ADD COLUMN     "fri_times" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "mon_times" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "sat_times" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "sun_times" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "thu_times" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "tue_times" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "wed_times" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "street" TEXT DEFAULT '',
    "number" TEXT DEFAULT '',
    "complement" TEXT DEFAULT '',
    "neighborhood" TEXT DEFAULT '',
    "city" TEXT DEFAULT '',
    "state" TEXT DEFAULT '',
    "zip_code" TEXT DEFAULT '',
    "country" TEXT DEFAULT '',
    "UserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "function" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "mon_times" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tue_times" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "wed_times" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "thu_times" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fri_times" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sat_times" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sun_times" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "UserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeService" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeService_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Address_UserId_key" ON "Address"("UserId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");

-- CreateIndex
CREATE INDEX "EmployeeService_employeeId_idx" ON "EmployeeService"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeService_serviceId_idx" ON "EmployeeService"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeService_employeeId_serviceId_key" ON "EmployeeService"("employeeId", "serviceId");

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeService" ADD CONSTRAINT "EmployeeService_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeService" ADD CONSTRAINT "EmployeeService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
