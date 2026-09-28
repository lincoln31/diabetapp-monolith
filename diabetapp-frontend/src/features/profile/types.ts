import type { DiabetesType } from '@/src/features/auth';

/** Tipos del contrato de perfil (spec fase 7, D-7.1). */

export type ActivityLevel = 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'ACTIVE';

/** Preferencias de avisos (spec fase 13, D-13.1): todos apagados por defecto. */
export interface NotificationPreferences {
  medicationReminders: boolean;
  glucoseReminders: boolean;
  motivational: boolean;
  achievements: boolean;
}

export interface Profile {
  typeOfDiabetes: DiabetesType | null;
  targetGlucoseMin: number | null;
  targetGlucoseMax: number | null;
  targetHba1c: number | null;
  dailyGlucoseChecks: number;
  exerciseGoalMinutes: number;
  weight: number | null;
  height: number | null;
  activityLevel: ActivityLevel | null;
  onboardingCompleted: boolean;
  notificationPreferences: NotificationPreferences;
  glucoseReminderTimes: string[];
}

/** Actualización parcial: `null` borra el campo, ausente lo deja igual. */
export type UpdateProfileInput = Partial<
  Omit<Profile, 'onboardingCompleted' | 'notificationPreferences'>
> & { notificationPreferences?: Partial<NotificationPreferences> };
