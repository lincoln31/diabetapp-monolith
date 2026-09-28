import { z } from 'zod';

export const parseCalculatorValue = (raw: string): number => Number(raw.trim().replace(',', '.'));

/** Número positivo capturado como texto (spec fase 10, RF-10.4, RNF-10.2). */
const positiveNumber = () =>
  z
    .string()
    .refine((raw) => raw.trim() !== '', 'Indica un valor')
    .refine(
      (raw) => raw.trim() === '' || Number.isFinite(parseCalculatorValue(raw)),
      'Debe ser un número',
    )
    .refine(
      (raw) =>
        raw.trim() === '' ||
        !Number.isFinite(parseCalculatorValue(raw)) ||
        parseCalculatorValue(raw) > 0,
      'Debe ser mayor que 0',
    );

export const carbCalculatorSchema = z.object({
  carbsPer100g: positiveNumber(),
  gramsEaten: positiveNumber(),
});

export type CarbCalculatorValues = z.infer<typeof carbCalculatorSchema>;
