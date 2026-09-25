import { z } from 'zod';
import { Profile, UpdateProfileInput } from './types';

/**
 * Reglas del formulario de perfil (spec fase 7, RF-7.9): las mismas que valida
 * el backend en `profile.schemas.ts`. Los números se capturan como texto y un
 * campo vacío significa «borrar».
 */
const optionalNumber = (label: string, min: number, max: number, unit: string, integer = false) =>
  z
    .string()
    .refine(
      (raw) => raw.trim() === '' || Number.isFinite(toNumber(raw)),
      `${label} debe ser un número`,
    )
    .refine(
      (raw) =>
        raw.trim() === '' ||
        !Number.isFinite(toNumber(raw)) ||
        !integer ||
        Number.isInteger(toNumber(raw)),
      `${label} debe ser un número entero`,
    )
    .refine(
      (raw) =>
        raw.trim() === '' ||
        !Number.isFinite(toNumber(raw)) ||
        (toNumber(raw) >= min && toNumber(raw) <= max),
      `${label} debe estar entre ${min} y ${max} ${unit}`,
    );

/** Como `optionalNumber`, pero obligatorio: la meta diaria no se puede borrar (spec fase 8, RF-8.8). */
const requiredInteger = (label: string, min: number, max: number, unit: string) =>
  z
    .string()
    .refine((raw) => raw.trim() !== '', `Indica ${label.toLowerCase()}`)
    .refine(
      (raw) => raw.trim() === '' || Number.isInteger(toNumber(raw)),
      `${label} debe ser un número entero`,
    )
    .refine(
      (raw) =>
        raw.trim() === '' ||
        !Number.isInteger(toNumber(raw)) ||
        (toNumber(raw) >= min && toNumber(raw) <= max),
      `${label} debe estar entre ${min} y ${max} ${unit}`,
    );

const toNumber = (raw: string): number => Number(raw.trim().replace(',', '.'));

export const profileFormSchema = z
  .object({
    typeOfDiabetes: z.enum(['', 'TYPE_1', 'TYPE_2', 'GESTATIONAL', 'PREDIABETES']),
    activityLevel: z.enum(['', 'SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE']),
    targetGlucoseMin: optionalNumber('El mínimo', 40, 400, 'mg/dL', true),
    targetGlucoseMax: optionalNumber('El máximo', 40, 400, 'mg/dL', true),
    targetHba1c: optionalNumber('La meta de HbA1c', 4, 14, '%'),
    dailyGlucoseChecks: requiredInteger('La meta diaria', 1, 20, 'lecturas'),
    weight: optionalNumber('El peso', 20, 400, 'kg'),
    height: optionalNumber('La altura', 50, 250, 'cm'),
  })
  .refine(
    (v) => {
      const min = v.targetGlucoseMin.trim();
      const max = v.targetGlucoseMax.trim();
      if (
        min === '' ||
        max === '' ||
        !Number.isFinite(toNumber(min)) ||
        !Number.isFinite(toNumber(max))
      ) {
        return true;
      }
      return toNumber(min) < toNumber(max);
    },
    { message: 'El mínimo del rango debe ser menor que el máximo', path: ['targetGlucoseMax'] },
  );

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

const numberToText = (value: number | null): string => (value === null ? '' : String(value));

export const profileToFormValues = (profile: Profile): ProfileFormValues => ({
  typeOfDiabetes: profile.typeOfDiabetes ?? '',
  activityLevel: profile.activityLevel ?? '',
  targetGlucoseMin: numberToText(profile.targetGlucoseMin),
  targetGlucoseMax: numberToText(profile.targetGlucoseMax),
  targetHba1c: numberToText(profile.targetHba1c),
  dailyGlucoseChecks: String(profile.dailyGlucoseChecks),
  weight: numberToText(profile.weight),
  height: numberToText(profile.height),
});

const textToNumber = (raw: string): number | null => (raw.trim() === '' ? null : toNumber(raw));

/** Convierte el formulario en el cuerpo del `PUT`: los campos vacíos viajan como `null`. */
export const formValuesToInput = (values: ProfileFormValues): UpdateProfileInput => ({
  typeOfDiabetes: values.typeOfDiabetes === '' ? null : values.typeOfDiabetes,
  activityLevel: values.activityLevel === '' ? null : values.activityLevel,
  targetGlucoseMin: textToNumber(values.targetGlucoseMin),
  targetGlucoseMax: textToNumber(values.targetGlucoseMax),
  targetHba1c: textToNumber(values.targetHba1c),
  dailyGlucoseChecks: toNumber(values.dailyGlucoseChecks),
  weight: textToNumber(values.weight),
  height: textToNumber(values.height),
});
