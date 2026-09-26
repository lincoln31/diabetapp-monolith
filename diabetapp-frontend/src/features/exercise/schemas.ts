import { z } from 'zod';
import { CreateExerciseInput } from './types';

/** Mismas reglas que `exercise.schemas.ts` del backend (spec fase 12, RF-12.10). */
export const exerciseFormSchema = z.object({
  type: z.enum(['WALKING', 'RUNNING', 'CYCLING', 'SWIMMING', 'GYM', 'YOGA', 'OTHER']),
  durationMinutes: z
    .string()
    .refine((raw) => raw.trim() !== '', 'Indica la duración en minutos')
    .refine(
      (raw) => raw.trim() === '' || Number.isInteger(Number(raw.trim())),
      'La duración debe ser un número entero de minutos',
    )
    .refine(
      (raw) =>
        raw.trim() === '' ||
        !Number.isInteger(Number(raw.trim())) ||
        (Number(raw.trim()) >= 1 && Number(raw.trim()) <= 600),
      'La duración debe estar entre 1 y 600 minutos',
    ),
  notes: z.string().trim().max(200, 'Máximo 200 caracteres'),
});

export type ExerciseFormValues = z.infer<typeof exerciseFormSchema>;

export const formValuesToInput = (values: ExerciseFormValues): CreateExerciseInput => ({
  type: values.type,
  durationMinutes: Number(values.durationMinutes.trim()),
  ...(values.notes.trim() !== '' ? { notes: values.notes.trim() } : {}),
});
