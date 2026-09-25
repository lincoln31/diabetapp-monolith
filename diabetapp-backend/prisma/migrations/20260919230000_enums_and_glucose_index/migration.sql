-- Fase 1 (RF-1.18, RF-1.19, RF-1.20): convierte los campos de texto en enums de la base de
-- datos conservando los datos existentes, y añade el índice del historial de glucosa.
--
-- Escrita a mano: `prisma migrate diff` propone DROP COLUMN + ADD COLUMN, que borraría los datos.

-- CreateEnum
CREATE TYPE "public"."DiabetesType" AS ENUM ('TYPE_1', 'TYPE_2', 'GESTATIONAL', 'PREDIABETES');

-- CreateEnum
CREATE TYPE "public"."ActivityLevel" AS ENUM ('SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE');

-- CreateEnum
CREATE TYPE "public"."InsulinType" AS ENUM ('RAPID', 'LONG_ACTING', 'MIXED', 'NONE');

-- CreateEnum
CREATE TYPE "public"."MomentOfDay" AS ENUM ('BEFORE_BREAKFAST', 'AFTER_BREAKFAST', 'BEFORE_LUNCH', 'AFTER_LUNCH', 'BEFORE_DINNER', 'AFTER_DINNER', 'BEFORE_SLEEP', 'OTHER');

-- AlterTable: glucose_readings.momentOfDay (valores no reconocidos -> OTHER)
ALTER TABLE "public"."glucose_readings"
  ALTER COLUMN "momentOfDay" DROP DEFAULT,
  ALTER COLUMN "momentOfDay" TYPE "public"."MomentOfDay"
    USING (
      CASE
        WHEN "momentOfDay" IN (
          'BEFORE_BREAKFAST', 'AFTER_BREAKFAST', 'BEFORE_LUNCH', 'AFTER_LUNCH',
          'BEFORE_DINNER', 'AFTER_DINNER', 'BEFORE_SLEEP', 'OTHER'
        ) THEN "momentOfDay"::"public"."MomentOfDay"
        ELSE 'OTHER'::"public"."MomentOfDay"
      END
    ),
  ALTER COLUMN "momentOfDay" SET DEFAULT 'OTHER';

-- AlterTable: users.typeOfDiabetes ('GESTACIONAL' -> 'GESTATIONAL'; no reconocidos -> NULL)
ALTER TABLE "public"."users"
  ALTER COLUMN "typeOfDiabetes" TYPE "public"."DiabetesType"
    USING (
      CASE
        WHEN "typeOfDiabetes" = 'GESTACIONAL' THEN 'GESTATIONAL'::"public"."DiabetesType"
        WHEN "typeOfDiabetes" IN ('TYPE_1', 'TYPE_2', 'GESTATIONAL', 'PREDIABETES')
          THEN "typeOfDiabetes"::"public"."DiabetesType"
        ELSE NULL
      END
    );

-- AlterTable: users.activityLevel (no reconocidos -> NULL)
ALTER TABLE "public"."users"
  ALTER COLUMN "activityLevel" TYPE "public"."ActivityLevel"
    USING (
      CASE
        WHEN "activityLevel" IN ('SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE')
          THEN "activityLevel"::"public"."ActivityLevel"
        ELSE NULL
      END
    );

-- AlterTable: users.insulinType (no reconocidos -> NULL)
ALTER TABLE "public"."users"
  ALTER COLUMN "insulinType" TYPE "public"."InsulinType"
    USING (
      CASE
        WHEN "insulinType" IN ('RAPID', 'LONG_ACTING', 'MIXED', 'NONE')
          THEN "insulinType"::"public"."InsulinType"
        ELSE NULL
      END
    );

-- CreateIndex
CREATE INDEX "glucose_readings_userId_timestamp_idx" ON "public"."glucose_readings"("userId", "timestamp");
