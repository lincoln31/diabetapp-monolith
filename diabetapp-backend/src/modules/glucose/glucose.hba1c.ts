import { Hba1cProjection } from './glucose.schemas';

/** Umbral de confiabilidad de la proyección (spec fase 6, D-6.2). */
export const MIN_READINGS_FOR_PROJECTION = 10;

/**
 * Proyección de HbA1c a partir del promedio de glucosa de los últimos 90 días,
 * con la fórmula ADAG estándar (spec fase 6, D-6.2):
 *
 *   HbA1c (%) = (promedio_mg/dL + 46.7) / 28.7
 *
 * Por debajo del umbral mínimo de lecturas, la proyección no se considera
 * confiable y se devuelve en null (nunca un número inventado).
 */
export const projectHba1c = (
  values: number[],
): Omit<Hba1cProjection, 'targetHba1c'> => {
  const sampleCount = values.length;

  if (sampleCount < MIN_READINGS_FOR_PROJECTION) {
    return { average90: null, sampleCount, sufficientData: false, projectedHba1c: null };
  }

  const average90 = Math.round((values.reduce((sum, v) => sum + v, 0) / sampleCount) * 10) / 10;
  const projectedHba1c = Math.round(((average90 + 46.7) / 28.7) * 10) / 10;

  return { average90, sampleCount, sufficientData: true, projectedHba1c };
};
