import React from 'react';
import { Banner } from '@/src/shared/components/ui';
import { RangeStatus } from '../rangeStatus';

interface RangeAlertProps {
  status: RangeStatus;
  min: number | null;
  max: number | null;
}

const rangeLabel = (min: number | null, max: number | null): string =>
  min !== null && max !== null
    ? `${min}–${max} mg/dL`
    : min !== null
      ? `mínimo ${min} mg/dL`
      : `máximo ${max} mg/dL`;

/**
 * Aviso bajo el campo de glucosa (spec fase 7, RF-7.11; rediseñado en la fase 15 con `Banner`:
 * icono + texto + color). Solo informa: no bloquea el guardado ni da consejo médico. Con
 * `in_range` o `unknown` no muestra nada (RF-7.12).
 */
const RangeAlert = ({ status, min, max }: RangeAlertProps) => {
  if (status !== 'low' && status !== 'high') {
    return null;
  }

  const isLow = status === 'low';

  return (
    <Banner
      tone={isLow ? 'warning' : 'danger'}
      title={`${isLow ? 'Por debajo de tu rango' : 'Por encima de tu rango'} (${rangeLabel(min, max)})`}
      message="Consulta a tu médico si se repite"
    />
  );
};

export default RangeAlert;
