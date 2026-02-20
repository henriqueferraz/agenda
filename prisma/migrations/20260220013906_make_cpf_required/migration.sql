/*
  Warnings:

  - Made the column `cpf` on table `Client` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Client" ALTER COLUMN "cpf" SET NOT NULL;
