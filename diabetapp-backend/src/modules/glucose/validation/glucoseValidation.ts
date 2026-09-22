import { z } from 'zod';

export const MOMENTS_OF_DAY = [
  'BEFORE_BREAKFAST',
  'AFTER_BREAKFAST',
  'BEFORE_LUNCH',
  'AFTER_LUNCH',
  'BEFORE_DINNER',
  'AFTER_DINNER',
  'BEFORE_SLEEP',
  'OTHER',
] as const;

export const createGlucoseSchema = z.object({
  value: z
    .number('El valor de glucosa debe ser un número')
    .int('El valor de glucosa debe ser un número entero')
    .min(20, 'El valor de glucosa debe estar entre 20 y 600 mg/dL')
    .max(600, 'El valor de glucosa debe estar entre 20 y 600 mg/dL'),

  timestamp: z.iso
    .datetime('La fecha debe tener formato ISO válido')
    .transform((value) => new Date(value)),

  momentOfDay: z.enum(MOMENTS_OF_DAY).optional(),

  notes: z
    .string()
    .max(200, 'Las notas no pueden superar 200 caracteres')
    .optional(),
});

export const updateGlucoseSchema = createGlucoseSchema.partial();
