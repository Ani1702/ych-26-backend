/*
  Warnings:

  - The values [LOCKED] on the enum `QualificationStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "QualificationStatus_new" AS ENUM ('NOT_SUBMITTED', 'SUBMITTED', 'UNDER_EVALUATION', 'QUALIFIED', 'NOT_QUALIFIED');
ALTER TABLE "Team" ALTER COLUMN "round0Status" DROP DEFAULT;
ALTER TABLE "Team" ALTER COLUMN "round1Status" DROP DEFAULT;
ALTER TABLE "Team" ALTER COLUMN "round2Status" DROP DEFAULT;
ALTER TABLE "Team" ALTER COLUMN "round3Status" DROP DEFAULT;
ALTER TABLE "Team" ALTER COLUMN "round0Status" TYPE "QualificationStatus_new" USING ("round0Status"::text::"QualificationStatus_new");
ALTER TABLE "Team" ALTER COLUMN "round1Status" TYPE "QualificationStatus_new" USING ("round1Status"::text::"QualificationStatus_new");
ALTER TABLE "Team" ALTER COLUMN "round2Status" TYPE "QualificationStatus_new" USING ("round2Status"::text::"QualificationStatus_new");
ALTER TABLE "Team" ALTER COLUMN "round3Status" TYPE "QualificationStatus_new" USING ("round3Status"::text::"QualificationStatus_new");
ALTER TYPE "QualificationStatus" RENAME TO "QualificationStatus_old";
ALTER TYPE "QualificationStatus_new" RENAME TO "QualificationStatus";
DROP TYPE "QualificationStatus_old";
ALTER TABLE "Team" ALTER COLUMN "round0Status" SET DEFAULT 'NOT_SUBMITTED';
ALTER TABLE "Team" ALTER COLUMN "round1Status" SET DEFAULT 'NOT_SUBMITTED';
ALTER TABLE "Team" ALTER COLUMN "round2Status" SET DEFAULT 'NOT_SUBMITTED';
ALTER TABLE "Team" ALTER COLUMN "round3Status" SET DEFAULT 'NOT_SUBMITTED';
COMMIT;

-- AlterTable
ALTER TABLE "Team" ALTER COLUMN "round0Status" SET DEFAULT 'NOT_SUBMITTED',
ALTER COLUMN "round1Status" SET DEFAULT 'NOT_SUBMITTED',
ALTER COLUMN "round2Status" SET DEFAULT 'NOT_SUBMITTED',
ALTER COLUMN "round3Status" SET DEFAULT 'NOT_SUBMITTED';
