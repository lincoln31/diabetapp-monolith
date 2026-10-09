import { calculateInsulinEffect, formatInsulinEffectMessage } from '../insulinEffect';

const hoursAfter = (iso: string, hours: number): string =>
  new Date(new Date(iso).getTime() + hours * 60 * 60 * 1000).toISOString();

describe('calculateInsulinEffect', () => {
  const base = '2026-09-19T10:00:00.000Z';

  it('calcula cuánto bajó y el ritmo por unidad, ~2 horas después', () => {
    const effect = calculateInsulinEffect({
      previous: { value: 200, insulinUnits: 4, timestamp: base },
      current: { value: 155, timestamp: hoursAfter(base, 2) },
    });

    expect(effect).toEqual({ dropMgDl: 45, insulinUnits: 4, ratePerUnit: 11.3, hoursElapsed: 2 });
  });

  it('da null si la lectura anterior no tenía insulina registrada', () => {
    const effect = calculateInsulinEffect({
      previous: { value: 200, insulinUnits: null, timestamp: base },
      current: { value: 155, timestamp: hoursAfter(base, 2) },
    });

    expect(effect).toBeNull();
  });

  it.each([
    ['muy pronto (30 min)', 0.5],
    ['muy tarde (5 horas)', 5],
  ])('da null si pasó %s', (_caso, hours) => {
    const effect = calculateInsulinEffect({
      previous: { value: 200, insulinUnits: 4, timestamp: base },
      current: { value: 155, timestamp: hoursAfter(base, hours) },
    });

    expect(effect).toBeNull();
  });

  it('también calcula cuando la glucosa subió', () => {
    const effect = calculateInsulinEffect({
      previous: { value: 150, insulinUnits: 2, timestamp: base },
      current: { value: 170, timestamp: hoursAfter(base, 2) },
    });

    expect(effect?.dropMgDl).toBe(-20);
  });
});

describe('formatInsulinEffectMessage', () => {
  it('con una sola unidad, la escribe en singular', () => {
    const message = formatInsulinEffectMessage({
      dropMgDl: 20,
      insulinUnits: 1,
      ratePerUnit: 20,
      hoursElapsed: 2,
    });

    expect(message).toBe('Bajó 20 mg/dL con 1 unidad (≈20 mg/dL por unidad)');
  });

  it('cuando subió, lo dice sin presentarlo como una bajada', () => {
    const message = formatInsulinEffectMessage({
      dropMgDl: -20,
      insulinUnits: 2,
      ratePerUnit: -10,
      hoursElapsed: 2,
    });

    expect(message).toBe('Subió 20 mg/dL pese a 2 unidades');
  });
});
