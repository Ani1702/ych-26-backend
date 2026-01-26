/*
  Warnings:

  - Added the required column `branch` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `school` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "branch" TEXT NOT NULL,
ADD COLUMN     "school" TEXT NOT NULL,
ALTER COLUMN "roomNo" DROP NOT NULL;
