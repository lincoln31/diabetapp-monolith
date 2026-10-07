import { Prisma } from '@prisma/client';
import prisma from '../../config/db';
import { AppError } from '../../shared/errors/AppError';
import { mergePreferences, readPreferences, readTimes } from './profile.notifications';
import { UpdateProfileInput } from './profile.schemas';

/** Campos que la API devuelve del perfil: nunca contraseña ni datos de sesión (spec fase 7, RF-7.1). */
const profileFields = {
  typeOfDiabetes: true,
  targetGlucoseMin: true,
  targetGlucoseMax: true,
  targetHba1c: true,
  dailyGlucoseChecks: true,
  exerciseGoalMinutes: true,
  weight: true,
  height: true,
  activityLevel: true,
  phone: true,
  birthDate: true,
  insulinCarbRatio: true,
  insulinSensitivityFactor: true,
  onboardingCompleted: true,
  notificationPreferences: true,
  reminderTimes: true,
} satisfies Prisma.UserSelect;

type StoredProfile = Prisma.UserGetPayload<{ select: typeof profileFields }>;

/**
 * Las preferencias salen normalizadas (spec fase 13, D-13.1): las cuatro claves siempre
 * presentes y los horarios como `glucoseReminderTimes`; el JSON crudo nunca sale tal cual.
 */
const toProfile = ({ notificationPreferences, reminderTimes, ...rest }: StoredProfile) => ({
  ...rest,
  notificationPreferences: readPreferences(notificationPreferences),
  glucoseReminderTimes: readTimes(reminderTimes),
});

export class ProfileService {
  async get(userId: string) {
    return toProfile(
      await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: profileFields }),
    );
  }

  /**
   * Actualización parcial del perfil propio (spec fase 7, RF-7.2 – RF-7.4, RF-7.13).
   * El id sale del token, así que no hay forma de tocar el perfil de otro usuario.
   */
  async update(userId: string, input: UpdateProfileInput) {
    const { notificationPreferences, glucoseReminderTimes, ...fields } = input;

    if (fields.targetGlucoseMin !== undefined || fields.targetGlucoseMax !== undefined) {
      const current = await prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { targetGlucoseMin: true, targetGlucoseMax: true },
      });

      // La regla se comprueba sobre el resultado final, no solo sobre lo enviado (RF-7.4)
      const min =
        fields.targetGlucoseMin !== undefined ? fields.targetGlucoseMin : current.targetGlucoseMin;
      const max =
        fields.targetGlucoseMax !== undefined ? fields.targetGlucoseMax : current.targetGlucoseMax;

      if (min !== null && max !== null && min >= max) {
        const field =
          fields.targetGlucoseMax !== undefined ? 'targetGlucoseMax' : 'targetGlucoseMin';

        throw new AppError('VALIDATION_ERROR', undefined, [
          { field, message: 'El mínimo del rango debe ser menor que el máximo' },
        ]);
      }
    }

    // Las preferencias se combinan con lo guardado: enviar una sola clave no borra las demás (RF-13.3)
    let mergedPreferences: Prisma.InputJsonObject | undefined;
    if (notificationPreferences !== undefined) {
      const stored = await prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { notificationPreferences: true },
      });
      mergedPreferences = mergePreferences(stored.notificationPreferences, notificationPreferences);
    }

    return toProfile(
      await prisma.user.update({
        where: { id: userId },
        data: {
          ...fields,
          onboardingCompleted: true,
          ...(mergedPreferences ? { notificationPreferences: mergedPreferences } : {}),
          ...(glucoseReminderTimes !== undefined ? { reminderTimes: glucoseReminderTimes } : {}),
        },
        select: profileFields,
      }),
    );
  }
}
