/*
  Warnings:

  - The `round0Submission` column on the `Submission` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `round1Submission` column on the `Submission` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `round2Submission` column on the `Submission` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `round3Submission` column on the `Submission` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "RoundStatus" AS ENUM ('LOCKED', 'LIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "QualificationStatus" AS ENUM ('LOCKED', 'NOT_SUBMITTED', 'SUBMITTED', 'UNDER_EVALUATION', 'QUALIFIED', 'NOT_QUALIFIED');

-- AlterTable
ALTER TABLE "Submission" DROP COLUMN "round0Submission",
ADD COLUMN     "round0Submission" JSONB,
DROP COLUMN "round1Submission",
ADD COLUMN     "round1Submission" JSONB,
DROP COLUMN "round2Submission",
ADD COLUMN     "round2Submission" JSONB,
DROP COLUMN "round3Submission",
ADD COLUMN     "round3Submission" JSONB;

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "round0Status" "QualificationStatus" NOT NULL DEFAULT 'LOCKED',
ADD COLUMN     "round1Status" "QualificationStatus" NOT NULL DEFAULT 'LOCKED',
ADD COLUMN     "round2Status" "QualificationStatus" NOT NULL DEFAULT 'LOCKED',
ADD COLUMN     "round3Status" "QualificationStatus" NOT NULL DEFAULT 'LOCKED';

-- CreateTable
CREATE TABLE "Round" (
    "roundId" INTEGER NOT NULL,
    "status" "RoundStatus" NOT NULL DEFAULT 'LOCKED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Round_pkey" PRIMARY KEY ("roundId")
);
