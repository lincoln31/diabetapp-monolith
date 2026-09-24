export type RangeStatus = 'low' | 'high' | 'in_range' | 'unknown';

/**
 * Compara un valor con el rango meta del usuario (spec fase 7, D-7.6, RF-7.11).
 * `unknown` si el valor no es un número o el usuario no tiene ningún límite: en ese caso no se avisa nada.
 * Los extremos exactos cuentan como dentro del rango.
 */
export const getRangeStatus = (
  value: number,
  min: number | null,
  max: number | null,
): RangeStatus => {
  if (!Number.isFinite(value) || (min === null && max === null)) {
    return 'unknown';
  }

  if (min !== null && value < min) return 'low';
  if (max !== null && value > max) return 'high';

  return 'in_range';
};
