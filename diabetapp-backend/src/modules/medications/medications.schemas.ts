import { z } from 'zod';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Los horarios se guardan ordenados y sin repetir (spec fase 11, D-11.3). */
const scheduledTimes = z
  .array(z.string().regex(TIME_REGEX, 'Cada horario debe tener formato HH:mm (24 horas)'))
  .min(1, 'Indica al menos un horario')
  .max(10, 'No puedes indicar más de 10 horarios')
  .refine((times) => new Set(times).size === times.length, 'Los horarios no pueden repetirse')
  .transform((times) => [...times].sort());

export const createMedicationSchema = z.object({
  name: z
    .string('El nombre es obligatorio')
    .trim()
    .min(1, 'El nombre es obligatorio')
    .max(80, 'El nombre no puede superar 80 caracteres'),
  dosage: z
    .string('La dosis es obligatoria')
    .trim()
    .min(1, 'La dosis es obligatoria')
    .max(40, 'La dosis no puede superar 40 caracteres'),
  scheduledTimes,
  notes: z.string().trim().max(300, 'Las notas no pueden superar 300 caracteres').nullish(),
});

// Actualiza el recurso completo (spec fase 11, D-11.3)
export const updateMedicationSchema = createMedicationSchema;

export const medicationIdParamsSchema = z.object({
  id: z.string().min(1, 'Identificador inválido'),
});

const FUTURE_MARGIN_MS = 5 * 60 * 1000;

export const logIntakeSchema = z.object({
  takenAt: z.iso
    .datetime('La fecha debe tener formato ISO válido')
    .transform((value) => new Date(value))
    .refine(
      (date) => date.getTime() <= Date.now() + FUTURE_MARGIN_MS,
      'La toma no puede ser futura',
    )
    .optional(),
});

export type CreateMedicationInput = z.infer<typeof createMedicationSchema>;
export type UpdateMedicationInput = z.infer<typeof updateMedicationSchema>;
export type MedicationIdParams = z.infer<typeof medicationIdParamsSchema>;
export type LogIntakeInput = z.infer<typeof logIntakeSchema>;

export interface MedicationView {
  id: string;
  name: string;
  dosage: string;
  scheduledTimes: string[];
  notes: string | null;
  takenToday: number;
}

export interface AdherencePeriod {
  expected: number;
  taken: number;
  percent: number | null;
}

export interface AdherenceStats {
  days7: AdherencePeriod;
  days30: AdherencePeriod;
}
