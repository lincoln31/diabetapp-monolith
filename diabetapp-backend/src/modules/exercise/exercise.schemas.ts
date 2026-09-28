import { ActivityType } from '@prisma/client';
import { z } from 'zod';

const isoDate = (message: string) => z.iso.datetime(message).transform((value) => new Date(value));

const FUTURE_MARGIN_MS = 5 * 60 * 1000;

// El enum vive en la base de datos: una sola lista de valores (spec fase 1, RF-1.18)
export const createExerciseSchema = z.object({
  type: z.enum(ActivityType, 'Tipo de actividad inválido'),
  durationMinutes: z
    .number('La duración debe ser un número')
    .int('La duración debe ser un número entero de minutos')
    .min(1, 'La duración debe estar entre 1 y 600 minutos')
    .max(600, 'La duración debe estar entre 1 y 600 minutos'),
  // Se valida antes de transformar: con un texto inválido, `transform` recibe el texto crudo (Zod 4)
  startedAt: z.iso
    .datetime('La fecha debe tener formato ISO válido')
    .refine(
      (value) => new Date(value).getTime() <= Date.now() + FUTURE_MARGIN_MS,
      'La actividad no puede ser futura',
    )
    .transform((value) => new Date(value))
    .optional(),
  notes: z.string().trim().max(200, 'Las notas no pueden superar 200 caracteres').optional(),
});

export const listExerciseQuerySchema = z
  .object({
    from: isoDate('El filtro "from" debe tener formato ISO válido').optional(),
    to: isoDate('El filtro "to" debe tener formato ISO válido').optional(),
    page: z.coerce.number().int().min(1, 'page debe ser 1 o mayor').default(1),
    limit: z.coerce
      .number()
      .int()
      .min(1, 'limit debe estar entre 1 y 100')
      .max(100, 'limit debe estar entre 1 y 100')
      .default(20),
  })
  .refine((data) => !data.from || !data.to || data.from <= data.to, {
    message: 'El filtro "from" debe ser anterior o igual a "to"',
    path: ['from'],
  });

export const exerciseIdParamsSchema = z.object({
  id: z.string().min(1, 'Identificador inválido'),
});

export type CreateExerciseInput = z.infer<typeof createExerciseSchema>;
export type ListExerciseQuery = z.infer<typeof listExerciseQuerySchema>;
export type ExerciseIdParams = z.infer<typeof exerciseIdParamsSchema>;

export interface GroupStats {
  days: number;
  average: number | null;
}

export interface CorrelationResult {
  sufficientData: boolean;
  withExercise: GroupStats;
  withoutExercise: GroupStats;
  /** withExercise.average - withoutExercise.average */
  difference: number | null;
}

export interface ExerciseSummary {
  todayMinutes: number;
  goalMinutes: number;
  last7DaysMinutes: number;
  correlation: CorrelationResult;
}
