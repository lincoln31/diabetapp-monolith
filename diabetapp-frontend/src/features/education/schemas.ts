import { z } from 'zod';

export const parseCalculatorValue = (raw: string): number => Number(raw.trim().replace(',', '.'));

/** Número positivo capturado como texto (spec fase 10, RF-10.4, RNF-10.2). */
const positiveNumber = (label: string) =>
  z
    .string()
    .refine((raw) => raw.trim() !== '', `Indica ${label}`)
    .refine(
      (raw) => raw.trim() === '' || Number.isFinite(parseCalculatorValue(raw)),
      `${label} debe ser un número`,
    )
    .refine(
      (raw) =>
        raw.trim() === '' ||
        !Number.isFinite(parseCalculatorValue(raw)) ||
        parseCalculatorValue(raw) > 0,
      `${label} debe ser mayor que 0`,
    );

export const carbCalculatorSchema = z.object({
  carbsPer100g: positiveNumber('Los carbohidratos por 100 g'),
  gramsEaten: positiveNumber('Los gramos de la porción'),
});

export type CarbCalculatorValues = z.infer<typeof carbCalculatorSchema>;
