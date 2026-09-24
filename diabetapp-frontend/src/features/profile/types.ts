import type { DiabetesType } from '@/src/features/auth';

/** Tipos del contrato de perfil (spec fase 7, D-7.1). */

export type ActivityLevel = 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'ACTIVE';

export interface Profile {
  typeOfDiabetes: DiabetesType | null;
  targetGlucoseMin: number | null;
  targetGlucoseMax: number | null;
  targetHba1c: number | null;
  weight: number | null;
  height: number | null;
  activityLevel: ActivityLevel | null;
  onboardingCompleted: boolean;
}

/** Actualización parcial: `null` borra el campo, ausente lo deja igual. */
export type UpdateProfileInput = Partial<Omit<Profile, 'onboardingCompleted'>>;
