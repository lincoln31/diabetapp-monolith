import { MomentOfDay } from '@prisma/client';
import { z } from 'zod';

const isoDate = (message: string) => z.iso.datetime(message).transform((value) => new Date(value));

export const createGlucoseSchema = z.object({
  value: z
    .number('El valor de glucosa debe ser un número')
    .int('El valor de glucosa debe ser un número entero')
    .min(20, 'El valor de glucosa debe estar entre 20 y 600 mg/dL')
    .max(600, 'El valor de glucosa debe estar entre 20 y 600 mg/dL'),

  timestamp: isoDate('La fecha debe tener formato ISO válido'),

  // El enum vive en la base de datos: una sola lista de valores (spec fase 1, RF-1.18)
  momentOfDay: z.enum(MomentOfDay).optional(),

  notes: z.string().max(200, 'Las notas no pueden superar 200 caracteres').optional(),
});

// Actualización parcial, pero con al menos un campo (spec fase 1, RF-1.17)
export const updateGlucoseSchema = createGlucoseSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debes enviar al menos un campo para actualizar',
  });

export const listGlucoseQuerySchema = z
  .object({
    from: isoDate('El filtro "from" debe tener formato ISO válido').optional(),
    to: isoDate('El filtro "to" debe tener formato ISO válido').optional(),
    page: z.coerce.number().int().min(1, 'page debe ser 1 o mayor').default(1),
    limit: z.coerce
      .number()
      .int()
      .min(1, 'limit debe estar entre 1 y 200')
      .max(200, 'limit debe estar entre 1 y 200')
      .default(50),
  })
  .refine((data) => !data.from || !data.to || data.from <= data.to, {
    message: 'El filtro "from" debe ser anterior o igual a "to"',
    path: ['from'],
  });

export const glucoseIdParamsSchema = z.object({
  id: z.string().min(1, 'Identificador inválido'),
});

export type CreateGlucoseInput = z.infer<typeof createGlucoseSchema>;
export type UpdateGlucoseInput = z.infer<typeof updateGlucoseSchema>;
export type ListGlucoseQuery = z.infer<typeof listGlucoseQuerySchema>;
export type GlucoseIdParams = z.infer<typeof glucoseIdParamsSchema>;
