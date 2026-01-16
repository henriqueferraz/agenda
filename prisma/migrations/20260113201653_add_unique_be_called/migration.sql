/*
  Warnings:

  - A unique constraint covering the columns `[be_called]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "be_called" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "User_be_called_key" ON "User"("be_called");
