/**
 * Efecto de la insulina entre dos lecturas consecutivas (spec fase 19, RF-19.3): cuánto bajó
 * (o subió) la glucosa desde la lectura anterior que tenía unidades de insulina registradas.
 * Pensado para el seguimiento a las ~2 horas del checkbox «Recordármelo en 2 horas» (fase 13).
 */

const MIN_HOURS = 1;
const MAX_HOURS = 4;

export interface InsulinEffectInput {
  previous: {
    value: number;
    insulinUnits: number | null;
    timestamp: string;
  };
  current: {
    value: number;
    timestamp: string;
  };
}

export interface InsulinEffectResult {
  /** Positivo si bajó, negativo si subió. */
  dropMgDl: number;
  insulinUnits: number;
  /** `dropMgDl / insulinUnits`, redondeado a 1 decimal. */
  ratePerUnit: number;
  hoursElapsed: number;
}

/**
 * `null` cuando la lectura anterior no tenía insulina registrada, o cuando el tiempo entre
 * ambas lecturas no cae dentro de la ventana de ~2 horas (entre 1 y 4, con margen para que el
 * paciente no mida exactamente al sonar la alarma).
 */
export const calculateInsulinEffect = ({
  previous,
  current,
}: InsulinEffectInput): InsulinEffectResult | null => {
  if (previous.insulinUnits == null || previous.insulinUnits <= 0) return null;

  const hoursElapsed =
    (new Date(current.timestamp).getTime() - new Date(previous.timestamp).getTime()) /
    (1000 * 60 * 60);

  if (hoursElapsed < MIN_HOURS || hoursElapsed > MAX_HOURS) return null;

  const dropMgDl = previous.value - current.value;

  return {
    dropMgDl,
    insulinUnits: previous.insulinUnits,
    ratePerUnit: Math.round((dropMgDl / previous.insulinUnits) * 10) / 10,
    hoursElapsed,
  };
};

/** Mensaje para el aviso al guardar (spec fase 19, RF-19.3). */
export const formatInsulinEffectMessage = (effect: InsulinEffectResult): string => {
  const units = effect.insulinUnits === 1 ? '1 unidad' : `${effect.insulinUnits} unidades`;

  if (effect.dropMgDl > 0) {
    return `Bajó ${effect.dropMgDl} mg/dL con ${units} (≈${effect.ratePerUnit} mg/dL por unidad)`;
  }

  if (effect.dropMgDl < 0) {
    return `Subió ${Math.abs(effect.dropMgDl)} mg/dL pese a ${units}`;
  }

  return `Se mantuvo igual con ${units}`;
};
