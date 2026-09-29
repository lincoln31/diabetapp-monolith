-- AlterTable
ALTER TABLE "medication_intakes" ADD COLUMN     "skipReason" TEXT,
ADD COLUMN     "taken" BOOLEAN NOT NULL DEFAULT true;
