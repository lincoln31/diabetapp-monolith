import { ActivityLevel, DiabetesType } from '@prisma/client';
import { z } from 'zod';

// Los enums vienen de la base de datos: una sola lista de valores (spec fase 1, RF-1.18).
// Cada campo admite `null` para borrarlo y `undefined` (ausente) para no tocarlo (spec fase 7, RF-7.2).
export const updateProfileSchema = z
  .object({
    typeOfDiabetes: z.enum(DiabetesType, 'Tipo de diabetes inválido').nullable(),
    activityLevel: z.enum(ActivityLevel, 'Nivel de actividad inválido').nullable(),
    targetGlucoseMin: z
      .number('El mínimo debe ser un número')
      .int('El mínimo debe ser un número entero')
      .min(40, 'El mínimo debe estar entre 40 y 400 mg/dL')
      .max(400, 'El mínimo debe estar entre 40 y 400 mg/dL')
      .nullable(),
    targetGlucoseMax: z
      .number('El máximo debe ser un número')
      .int('El máximo debe ser un número entero')
      .min(40, 'El máximo debe estar entre 40 y 400 mg/dL')
      .max(400, 'El máximo debe estar entre 40 y 400 mg/dL')
      .nullable(),
    targetHba1c: z
      .number('La meta de HbA1c debe ser un número')
      .min(4, 'La meta de HbA1c debe estar entre 4 y 14 %')
      .max(14, 'La meta de HbA1c debe estar entre 4 y 14 %')
      .nullable(),
    // La meta diaria no se puede borrar: sin meta no hay avance que mostrar (spec fase 8, RF-8.8)
    dailyGlucoseChecks: z
      .number('La meta diaria debe ser un número')
      .int('La meta diaria debe ser un número entero')
      .min(1, 'La meta diaria debe estar entre 1 y 20 lecturas')
      .max(20, 'La meta diaria debe estar entre 1 y 20 lecturas'),
    weight: z
      .number('El peso debe ser un número')
      .min(20, 'El peso debe estar entre 20 y 400 kg')
      .max(400, 'El peso debe estar entre 20 y 400 kg')
      .nullable(),
    height: z
      .number('La altura debe ser un número')
      .min(50, 'La altura debe estar entre 50 y 250 cm')
      .max(250, 'La altura debe estar entre 50 y 250 cm')
      .nullable(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debes enviar al menos un campo para actualizar',
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
