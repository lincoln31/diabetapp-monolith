import { MomentOfDay } from './types';

/** Opciones del selector: los valores son los del enum del backend. */
export const MOMENT_OF_DAY_OPTIONS: { label: string; value: MomentOfDay }[] = [
  { label: 'En ayunas', value: 'BEFORE_BREAKFAST' },
  { label: 'Después del desayuno', value: 'AFTER_BREAKFAST' },
  { label: 'Antes del almuerzo', value: 'BEFORE_LUNCH' },
  { label: 'Después del almuerzo', value: 'AFTER_LUNCH' },
  { label: 'Antes de la cena', value: 'BEFORE_DINNER' },
  { label: 'Después de la cena', value: 'AFTER_DINNER' },
  { label: 'Antes de dormir', value: 'BEFORE_SLEEP' },
  { label: 'Otro momento', value: 'OTHER' },
];

/** Rango aceptado por el backend, en mg/dL. */
export const GLUCOSE_MIN = 20;
export const GLUCOSE_MAX = 600;
export const NOTES_MAX_LENGTH = 200;
