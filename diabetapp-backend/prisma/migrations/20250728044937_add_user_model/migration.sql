-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "typeOfDiabetes" TEXT,
    "diagnosedAt" TIMESTAMP(3),
    "yearsWithDiabetes" INTEGER,
    "targetHba1c" DOUBLE PRECISION,
    "targetGlucoseMin" INTEGER DEFAULT 80,
    "targetGlucoseMax" INTEGER DEFAULT 180,
    "birthDate" TIMESTAMP(3),
    "weight" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "activityLevel" TEXT,
    "currentMedications" TEXT,
    "insulinType" TEXT,
    "notificationPreferences" JSONB,
    "reminderTimes" JSONB,
    "dailyGlucoseChecks" INTEGER DEFAULT 4,
    "exerciseGoalMinutes" INTEGER DEFAULT 30,
    "timezone" TEXT DEFAULT 'America/Bogota',
    "language" TEXT DEFAULT 'es',
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "dataConsentAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
