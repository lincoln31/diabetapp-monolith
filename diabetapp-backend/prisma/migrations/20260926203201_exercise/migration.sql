-- CreateEnum
CREATE TYPE "public"."ActivityType" AS ENUM ('WALKING', 'RUNNING', 'CYCLING', 'SWIMMING', 'GYM', 'YOGA', 'OTHER');

-- CreateTable
CREATE TABLE "public"."exercise_activities" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."ActivityType" NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exercise_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "exercise_activities_userId_startedAt_idx" ON "public"."exercise_activities"("userId", "startedAt");

-- AddForeignKey
ALTER TABLE "public"."exercise_activities" ADD CONSTRAINT "exercise_activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
