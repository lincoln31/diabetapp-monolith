import { z } from 'zod';
import { GLUCOSE_MAX, GLUCOSE_MIN, NOTES_MAX_LENGTH } from './constants';

/**
 * Reglas del formulario de glucosa (spec fase 3, RF-3.11).
 * Son las mismas que valida el backend en `glucose.schemas.ts`.
 */
export const createGlucoseFormSchema = z.object({
  value: z
    .string()
    .min(1, 'Ingresa el valor de glucosa')
    .refine((raw) => Number.isInteger(Number(raw)), 'El valor debe ser un número entero')
    .refine(
      (raw) => Number(raw) >= GLUCOSE_MIN && Number(raw) <= GLUCOSE_MAX,
      `El valor debe estar entre ${GLUCOSE_MIN} y ${GLUCOSE_MAX} mg/dL`,
    ),
  momentOfDay: z.enum([
    'BEFORE_BREAKFAST',
    'AFTER_BREAKFAST',
    'BEFORE_LUNCH',
    'AFTER_LUNCH',
    'BEFORE_DINNER',
    'AFTER_DINNER',
    'BEFORE_SLEEP',
    'OTHER',
  ]),
  notes: z.string().max(NOTES_MAX_LENGTH, `Máximo ${NOTES_MAX_LENGTH} caracteres`),
  timestamp: z.date(),
  // Unidades de insulina aplicadas, opcional (spec fase 19). Texto vacío = no se aplicó.
  insulinUnits: z
    .string()
    .refine(
      (raw) => raw.trim() === '' || Number.isFinite(Number(raw.replace(',', '.'))),
      'Debe ser un número',
    )
    .refine((raw) => {
      if (raw.trim() === '') return true;
      const n = Number(raw.replace(',', '.'));
      return n >= 0.5 && n <= 100;
    }, 'Las unidades deben estar entre 0.5 y 100'),
});

export type CreateGlucoseFormValues = z.infer<typeof createGlucoseFormSchema>;
