/*
  Warnings:

  - A unique constraint covering the columns `[token_called]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "token_called" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_token_called_key" ON "User"("token_called");
