import { ActivityLevel, DiabetesType } from '@prisma/client';
import { z } from 'zod';
import { TIME_REGEX } from './profile.notifications';

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
    // La meta de ejercicio tampoco se borra (spec fase 12, RF-12.7)
    exerciseGoalMinutes: z
      .number('La meta de ejercicio debe ser un número')
      .int('La meta de ejercicio debe ser un número entero')
      .min(5, 'La meta de ejercicio debe estar entre 5 y 300 minutos')
      .max(300, 'La meta de ejercicio debe estar entre 5 y 300 minutos'),
    // Preferencias de notificaciones (spec fase 13, D-13.1): objeto estricto, parcial dentro del JSON
    notificationPreferences: z
      .strictObject({
        medicationReminders: z.boolean('El valor debe ser verdadero o falso'),
        glucoseReminders: z.boolean('El valor debe ser verdadero o falso'),
        motivational: z.boolean('El valor debe ser verdadero o falso'),
        achievements: z.boolean('El valor debe ser verdadero o falso'),
      })
      .partial(),
    glucoseReminderTimes: z
      .array(z.string().regex(TIME_REGEX, 'Cada horario debe tener formato HH:mm (24 horas)'))
      .max(6, 'No puedes indicar más de 6 horarios')
      .refine((times) => new Set(times).size === times.length, 'Los horarios no pueden repetirse')
      .transform((times) => [...times].sort()),
    // Datos personales que dejaron de pedirse al registrarse (spec fase 15, D-15.5)
    phone: z
      .string()
      .regex(/^[0-9+\-\s()]{10,20}$/, 'Teléfono debe tener un formato válido')
      .nullable(),
    birthDate: z.iso
      .datetime('Fecha debe ser formato ISO válido')
      .refine((value) => new Date(value).getTime() <= Date.now(), 'La fecha no puede ser futura')
      .transform((value) => new Date(value))
      .nullable(),
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
