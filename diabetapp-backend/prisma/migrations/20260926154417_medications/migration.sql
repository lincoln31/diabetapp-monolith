-- CreateTable
CREATE TABLE "public"."medications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "scheduledTimes" TEXT[],
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."medication_intakes" (
    "id" TEXT NOT NULL,
    "medicationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "takenAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medication_intakes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "medications_userId_active_idx" ON "public"."medications"("userId", "active");

-- CreateIndex
CREATE INDEX "medication_intakes_userId_takenAt_idx" ON "public"."medication_intakes"("userId", "takenAt");

-- CreateIndex
CREATE INDEX "medication_intakes_medicationId_idx" ON "public"."medication_intakes"("medicationId");

-- AddForeignKey
ALTER TABLE "public"."medications" ADD CONSTRAINT "medications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."medication_intakes" ADD CONSTRAINT "medication_intakes_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "public"."medications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."medication_intakes" ADD CONSTRAINT "medication_intakes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
