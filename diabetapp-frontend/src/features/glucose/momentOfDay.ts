import { MomentOfDay } from './types';

/**
 * Momento del día que se propone según la hora (spec fase 15, RF-15.8, CA-15.9): el valor por
 * defecto ya no es siempre «En ayunas». Es una sugerencia: el paciente puede cambiarla.
 */
export const suggestMomentOfDay = (date: Date): MomentOfDay => {
  const hour = date.getHours();

  if (hour >= 5 && hour <= 8) return 'BEFORE_BREAKFAST';
  if (hour >= 9 && hour <= 10) return 'AFTER_BREAKFAST';
  if (hour >= 11 && hour <= 12) return 'BEFORE_LUNCH';
  if (hour >= 13 && hour <= 15) return 'AFTER_LUNCH';
  if (hour >= 16 && hour <= 18) return 'BEFORE_DINNER';
  if (hour >= 19 && hour <= 20) return 'AFTER_DINNER';

  return 'BEFORE_SLEEP';
};
