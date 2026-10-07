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

/** Número cero o positivo capturado como texto (spec fase 17, RF-17.3): sin carbohidratos es válido (solo corrección). */
const nonNegativeNumber = () =>
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
        parseCalculatorValue(raw) >= 0,
      'No puede ser negativo',
    );

export const insulinCalculatorSchema = z.object({
  carbsGrams: nonNegativeNumber(),
  currentGlucose: positiveNumber(),
});

export type InsulinCalculatorValues = z.infer<typeof insulinCalculatorSchema>;
