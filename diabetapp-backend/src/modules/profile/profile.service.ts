import { Prisma } from '@prisma/client';
import prisma from '../../config/db';
import { AppError } from '../../shared/errors/AppError';
import { UpdateProfileInput } from './profile.schemas';

/** Campos que la API devuelve del perfil: nunca contraseña ni datos de sesión (spec fase 7, RF-7.1). */
const profileFields = {
  typeOfDiabetes: true,
  targetGlucoseMin: true,
  targetGlucoseMax: true,
  targetHba1c: true,
  weight: true,
  height: true,
  activityLevel: true,
  onboardingCompleted: true,
} satisfies Prisma.UserSelect;

export class ProfileService {
  async get(userId: string) {
    return prisma.user.findUniqueOrThrow({ where: { id: userId }, select: profileFields });
  }

  /**
   * Actualización parcial del perfil propio (spec fase 7, RF-7.2 – RF-7.4, RF-7.13).
   * El id sale del token, así que no hay forma de tocar el perfil de otro usuario.
   */
  async update(userId: string, input: UpdateProfileInput) {
    if (input.targetGlucoseMin !== undefined || input.targetGlucoseMax !== undefined) {
      const current = await prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { targetGlucoseMin: true, targetGlucoseMax: true },
      });

      // La regla se comprueba sobre el resultado final, no solo sobre lo enviado (RF-7.4)
      const min =
        input.targetGlucoseMin !== undefined ? input.targetGlucoseMin : current.targetGlucoseMin;
      const max =
        input.targetGlucoseMax !== undefined ? input.targetGlucoseMax : current.targetGlucoseMax;

      if (min !== null && max !== null && min >= max) {
        const field =
          input.targetGlucoseMax !== undefined ? 'targetGlucoseMax' : 'targetGlucoseMin';

        throw new AppError('VALIDATION_ERROR', undefined, [
          { field, message: 'El mínimo del rango debe ser menor que el máximo' },
        ]);
      }
    }

    return prisma.user.update({
      where: { id: userId },
      data: { ...input, onboardingCompleted: true },
      select: profileFields,
    });
  }
}
